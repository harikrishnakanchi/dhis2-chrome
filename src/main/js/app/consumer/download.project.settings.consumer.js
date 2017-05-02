define(["lodash", "moment"], function(_, moment) {
    return function($q, systemSettingService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository, mergeBy, excludedLinelistOptionsMerger, changeLogRepository, dataStoreService, orgUnitRepository) {
        this.run = function() {
            var projectIdsPromise = getUserProjectIds();
            var remoteUpdatedKeysPromise = projectIdsPromise.then(getChangeLog).then(dataStoreService.getUpdatedKeys);
            var localOpUnitAndModuleIdsPromise = projectIdsPromise.then(getModuleAndOpUnitIds);
            return $q.all([remoteUpdatedKeysPromise, localOpUnitAndModuleIdsPromise]).then(function (data) {
                var moduleIds = _.last(data).moduleIds;
                var opUnitIds = _.last(data).opUnitIds;
                var updatedKeys = _.first(data);
                return mergeAndSaveReferralLocations(opUnitIds, updatedKeys.referralLocations)
                    .then(_.partial(mergeAndSaveExcludedDataElements, moduleIds, updatedKeys.excludedDataElements));
            }).then(function () {
                return projectIdsPromise
                    .then(downloadAndMergeExcludedOptions)
                    .then(downloadedProjectSettings)
                    .then(function(projectSettings) {
                        return mergeAndSavePatientOriginDetails(projectSettings);
                    });
            }).catch(function (err) {
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

        var downloadedProjectSettings = function(projectIds) {
            if (_.isEmpty(projectIds))
                return;

            return systemSettingService.getProjectSettings(projectIds);
        };

        var downloadAndMergeExcludedOptions = function (projectIds) {
            return _.reduce(projectIds, function (promise, projectId) {
                return promise.then(_.partial(excludedLinelistOptionsMerger.mergeAndSaveForProject, projectId));
            }, $q.when()).then(function () {
                return projectIds;
            });
        };

        var merge = function (remoteCollection, localCollection) {
            var equalPredicate = function(itemA, itemB) {
                return itemA && itemB && itemA.orgUnit === itemB.orgUnit;
            };

            return $q.when(mergeBy.lastUpdated({"remoteTimeField": "clientLastUpdated", "localTimeField": "clientLastUpdated", "eq": equalPredicate}, remoteCollection, localCollection));
        };

        var mergeAndSaveReferralLocations = function (localOpUnitIds, remoteOpUnitIds) {
            var opUnitIdsToMerge = _.intersection(localOpUnitIds, remoteOpUnitIds);
            return $q.all([referralLocationsRepository.findAll(opUnitIdsToMerge), dataStoreService.getReferrals(opUnitIdsToMerge)]).then(function (data) {
                var localReferrals = data[0];
                var remoteReferrals = data[1];
                return merge(remoteReferrals, localReferrals).then(referralLocationsRepository.upsert);
            });
        };

        var mergeAndSavePatientOriginDetails = function(allProjectSettings) {

            var mergePatientOrigins = function(remoteOriginsAndOrgUnit) {
                return patientOriginRepository.get(remoteOriginsAndOrgUnit.orgUnit)
                    .then(function(localOriginsAndOrgUnit) {
                        localOriginsAndOrgUnit = localOriginsAndOrgUnit || {};
                        var mergedOrigins = mergeBy.lastUpdated({"remoteTimeField": "clientLastUpdated", "localTimeField": "clientLastUpdated"}, remoteOriginsAndOrgUnit.origins, localOriginsAndOrgUnit.origins || []);
                        return $q.when(mergedOrigins);
                    });
            };

            var createMergedPatientOrigins = function(orgUnitAndOriginMap) {
                var patientOrigins = _.reduce(orgUnitAndOriginMap, function(patientOrigins, origins, orgUnit){
                    patientOrigins.push({
                        "orgUnit" : orgUnit,
                        "origins" : origins
                    });
                    return patientOrigins;
                }, []);
                return $q.when(patientOrigins);
            };

            var updatePatientOrigins = function(patientOrigins) {
                if (_.isEmpty(patientOrigins))
                    return $q.when({});
                return patientOriginRepository.upsert(patientOrigins);
            };

            var orgUnitAndOriginsMapper = _.reduce(allProjectSettings, function(orgUnitAndOrigins, projectSettings) {
                _.each(projectSettings.patientOrigins, function(item) {
                    orgUnitAndOrigins[item.orgUnit] = mergePatientOrigins(item);
                });
                return orgUnitAndOrigins;
            }, {});

            return $q.all(orgUnitAndOriginsMapper)
                .then(createMergedPatientOrigins)
                .then(updatePatientOrigins);
        };

        var mergeAndSaveExcludedDataElements = function (localModuleIds, remoteModuleIds) {
            var moduleIdsToMerge = _.intersection(localModuleIds, remoteModuleIds);

            return $q.all([excludedDataElementsRepository.findAll(moduleIdsToMerge), dataStoreService.getExcludedDataElements(moduleIdsToMerge)])
                .then(function (data) {
                var localExcludedDataElements = data[0];
                var remoteExcludedDataElements = data[1];
                return merge(remoteExcludedDataElements, localExcludedDataElements).then(excludedDataElementsRepository.upsert);
            });
        };

    };
});
