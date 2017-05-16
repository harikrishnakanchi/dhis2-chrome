define(["lodash", "moment"], function(_, moment) {
    return function($q, systemInfoService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository, mergeBy, changeLogRepository, dataStoreService, orgUnitRepository, excludedLineListOptionsRepository) {
        this.run = function () {
            var systemTimePromise = systemInfoService.getServerDate();
            var projectIdsPromise = systemTimePromise.then(getUserProjectIds);
            var changeLogPromise = projectIdsPromise.then(getChangeLog);
            var remoteUpdatedKeysPromise = projectIdsPromise.then(_.curry(dataStoreService.getUpdatedData, 2)).then(changeLogPromise.then.bind(changeLogPromise));
            var localOpUnitAndModuleIdsPromise = projectIdsPromise.then(getModuleAndOpUnitIds);

            return $q.all([remoteUpdatedKeysPromise, localOpUnitAndModuleIdsPromise])
                .then(function (data) {
                    var moduleIds = _.last(data).moduleIds;
                    var opUnitIds = _.last(data).opUnitIds;
                    var updatedKeys = _.first(data);
                    return mergeAndSaveReferralLocations(opUnitIds, updatedKeys.referralLocations)
                        .then(_.partial(mergeAndSaveExcludedDataElements, moduleIds, updatedKeys.excludedDataElements))
                        .then(_.partial(mergeAndSavePatientOrigins, opUnitIds, updatedKeys.patientOrigins))
                        .then(_.partial(mergeAndSaveExcludedLineListOptions, moduleIds, updatedKeys.excludedOptions));
                })
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

        var merge = function (remoteCollection, localCollection, equalPredicate) {
            return mergeBy.lastUpdated({"remoteTimeField": "clientLastUpdated", "localTimeField": "clientLastUpdated", "eq": equalPredicate}, remoteCollection, localCollection);
        };

        var equalPredicate = function(itemA, itemB) {
            return itemA && itemA.orgUnit && itemA.orgUnit === itemB.orgUnit;
        };

        var mergeAndSaveReferralLocations = function (localOpUnitIds, remoteReferrals) {
            return referralLocationsRepository.findAll(localOpUnitIds).then(function (localReferrals) {
                return referralLocationsRepository.upsert(merge(remoteReferrals, localReferrals, equalPredicate));
            });
        };

        var mergeAndSavePatientOrigins = function (localOpUnitIds, remotePatientOriginsForAllOpUnits) {
            return patientOriginRepository.findAll(localOpUnitIds).then(function (localPatientOriginDetails) {
                var indexedLocalPatientsOriginsForAllOpUnits = _.indexBy(localPatientOriginDetails, 'orgUnit');
                return _.map(remotePatientOriginsForAllOpUnits, function (patientOriginsForOpUnit) {
                    var matchingLocalPatientOrigin = _.get(indexedLocalPatientsOriginsForAllOpUnits, patientOriginsForOpUnit.orgUnit, {origins: []});
                    patientOriginsForOpUnit.origins = merge(patientOriginsForOpUnit.origins, matchingLocalPatientOrigin.origins);
                    return patientOriginsForOpUnit;
                });
            }).then(patientOriginRepository.upsert);
        };

        var mergeAndSaveExcludedDataElements = function (localModuleIds, remoteExcludedDataElements) {
            return excludedDataElementsRepository.findAll(localModuleIds)
                .then(function (localExcludedDataElements) {
                    return excludedDataElementsRepository.upsert(merge(remoteExcludedDataElements, localExcludedDataElements, equalPredicate));
                });
        };

        var mergeAndSaveExcludedLineListOptions = function (localModuleIds, remoteExcludedOptions) {
            var equalPredicate = function(itemA, itemB) {
                return itemA && itemA.moduleId && itemA.moduleId === itemB.moduleId;
            };
            return excludedLineListOptionsRepository.findAll(localModuleIds).then(function (localExcludedOptions) {
                return excludedLineListOptionsRepository.upsert(merge(remoteExcludedOptions, localExcludedOptions, equalPredicate));
            });
        };

    };
});
