define(["lodash", "moment"], function(_, moment) {
    return function($q, systemInfoService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository, mergeBy, excludedLinelistOptionsMerger, changeLogRepository, dataStoreService, orgUnitRepository) {
        this.run = function () {
            var systemTimePromise = systemInfoService.getServerDate();
            var projectIdsPromise = systemTimePromise.then(getUserProjectIds);
            var remoteUpdatedKeysPromise = projectIdsPromise.then(getChangeLog).then(dataStoreService.getUpdatedKeys);
            var localOpUnitAndModuleIdsPromise = projectIdsPromise.then(getModuleAndOpUnitIds);

            return $q.all([remoteUpdatedKeysPromise, localOpUnitAndModuleIdsPromise])
                .then(function (data) {
                    var moduleIds = _.last(data).moduleIds;
                    var opUnitIds = _.last(data).opUnitIds;
                    var updatedKeys = _.first(data);
                    return mergeAndSaveReferralLocations(opUnitIds, updatedKeys.referralLocations)
                        .then(_.partial(mergeAndSaveExcludedDataElements, moduleIds, updatedKeys.excludedDataElements))
                        .then(_.partial(mergeAndSavePatientOrigins, opUnitIds, updatedKeys.patientOrigins));
                })
                .then(_.partial(projectIdsPromise.then.bind(projectIdsPromise), downloadAndMergeExcludedOptions))
                .then(function () {
                    return projectIdsPromise.then(_.curry(updateChangeLog)).then(systemTimePromise.then.bind(systemTimePromise));
                })
                .catch(function (err) {
                    return err === 'noProjectIds' ? $q.when() : $q.reject(err);
                });
        };

        var getUserProjectIds = function() {
            return userPreferenceRepository.getCurrentUsersProjectIds().then(function (projectIds) {
                return _.isEmpty(projectIds) ? $q.reject('noProjectIds') : $q.when(projectIds);
            });
        };

        var getModuleAndOpUnitIds = function (projectIds) {
            return $q.all([orgUnitRepository.getAllModulesInOrgUnits(projectIds), orgUnitRepository.getAllOpUnitsInOrgUnits(projectIds)])
                .then(function (data) {
                    var modules = _.first(data);
                    var opUnits = _.last(data);
                    return {
                        moduleIds: _.map(modules, 'id'),
                        opUnitIds: _.map(opUnits, 'id')
                    };
                });
        };

        var getChangeLog = function (projectIds) {
            var getMinimumValue = function (changeLogs) {
                if (_.isEmpty(changeLogs)) return;
                return _.min(changeLogs, function (changeLog) {
                    return moment(changeLog).valueOf();
                });
            };

            return $q.all(_.map(projectIds, function (projectId) {
                return changeLogRepository.get("projectSettings:" + projectId);
            })).then(_.compact).then(getMinimumValue);
        };

        var updateChangeLog = function (projectIds, time) {
            return $q.all(_.map(projectIds, function (projectId) {
                return changeLogRepository.upsert("projectSettings:" + projectId, time);
            }));
        };

        var downloadAndMergeExcludedOptions = function (projectIds) {
            return _.reduce(projectIds, function (promise, projectId) {
                return promise.then(_.partial(excludedLinelistOptionsMerger.mergeAndSaveForProject, projectId));
            }, $q.when());
        };

        var merge = function (remoteCollection, localCollection) {
            var equalPredicate = function(itemA, itemB) {
                return itemA && itemB && itemA.orgUnit === itemB.orgUnit;
            };

            return mergeBy.lastUpdated({"remoteTimeField": "clientLastUpdated", "localTimeField": "clientLastUpdated", "eq": equalPredicate}, remoteCollection, localCollection);
        };

        var mergeAndSaveReferralLocations = function (localOpUnitIds, remoteOpUnitIds) {
            var opUnitIdsToMerge = _.intersection(localOpUnitIds, remoteOpUnitIds);
            return $q.all([referralLocationsRepository.findAll(opUnitIdsToMerge), dataStoreService.getReferrals(opUnitIdsToMerge)]).then(function (data) {
                var localReferrals = data[0];
                var remoteReferrals = data[1];
                return referralLocationsRepository.upsert(merge(remoteReferrals, localReferrals));
            });
        };

        var mergeAndSavePatientOrigins = function (localOpUnitIds, remoteOpUnitIds) {
            var opUnitIdsToMerge = _.intersection(localOpUnitIds, remoteOpUnitIds);
            return $q.all([patientOriginRepository.findAll(opUnitIdsToMerge), dataStoreService.getPatientOrigins(opUnitIdsToMerge)]).then(function (data) {
                var remotePatientOriginsForAllOpUnits = data[1];
                var indexedLocalPatientsOriginsForAllOpUnits = _.indexBy(data[0], 'orgUnit');
                return _.map(remotePatientOriginsForAllOpUnits, function (patientOriginsForOpUnit) {
                    var matchingLocalPatientOrigin = _.get(indexedLocalPatientsOriginsForAllOpUnits, patientOriginsForOpUnit.orgUnit, {origins: []});
                    patientOriginsForOpUnit.origins = merge(patientOriginsForOpUnit.origins, matchingLocalPatientOrigin.origins);
                    return patientOriginsForOpUnit;
                });
            }).then(patientOriginRepository.upsert);
        };

        var mergeAndSaveExcludedDataElements = function (localModuleIds, remoteModuleIds) {
            var moduleIdsToMerge = _.intersection(localModuleIds, remoteModuleIds);

            return $q.all([excludedDataElementsRepository.findAll(moduleIdsToMerge), dataStoreService.getExcludedDataElements(moduleIdsToMerge)])
                .then(function (data) {
                var localExcludedDataElements = data[0];
                var remoteExcludedDataElements = data[1];
                return excludedDataElementsRepository.upsert(merge(remoteExcludedDataElements, localExcludedDataElements));
            });
        };

    };
});
