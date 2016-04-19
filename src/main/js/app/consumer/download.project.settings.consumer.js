define(["lodash"], function(_) {
    return function($q, systemSettingService, userPreferenceRepository, referralLocationsRepository, patientOriginRepository, excludedDataElementsRepository, mergeBy) {
        this.run = function() {
            return getUserProjectIds()
                .then(downloadedProjectSettings)
                .then(function(projectSettings) {
                    return $q.all([saveReferrals(projectSettings), mergeAndSavePatientOriginDetails(projectSettings), saveExcludedDataElements(projectSettings)]);
                });
        };

        var getUserProjectIds = function() {
            return userPreferenceRepository.getCurrentUsersProjectIds();
        };

        var downloadedProjectSettings = function(projectIds) {
            if (_.isEmpty(projectIds))
                return;

            return systemSettingService.getProjectSettings(projectIds);
        };

        var saveReferrals = function(projectSettings) {
            var referrals = _.transform(projectSettings, function(result, settings) {
                _.each(settings.referralLocations, function(item) {
                    result.push(item);
                });
            }, []);

            if (_.isEmpty(referrals))
                return;

            return referralLocationsRepository.upsert(referrals);
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

        var saveExcludedDataElements = function(projectSettings) {
            var excludedDataElements = _.transform(projectSettings, function(result, settings) {
                _.each(settings.excludedDataElements, function(item) {
                    result.push(item);
                });
            }, []);

            if (_.isEmpty(excludedDataElements))
                return;

            return excludedDataElementsRepository.upsert(excludedDataElements);
        };

    };
});
