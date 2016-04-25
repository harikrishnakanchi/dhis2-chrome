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
            var allReferralLocations = _.transform(projectSettings, function(result, settings) {
                _.each(settings.referralLocations, function(item) {
                    result.push(item);
                });
            }, []);

            if (_.isEmpty(allReferralLocations))
                return;

            var getLocalReferralLocations = function (referralLocationsFromDHIS) {
                var orgUnitIds = _.pluck(referralLocationsFromDHIS, "orgUnit");
                return referralLocationsRepository.findAll(orgUnitIds);
            };

            var mergeAndSave = function (remoteLocations, localLocations) {
                var equalPredicate = function(referralLocation1, referralLocation2) {
                    return referralLocation1.orgUnit && referralLocation2 && referralLocation1.orgUnit === referralLocation2.orgUnit;
                };

                return $q.when(mergeBy.lastUpdated({"remoteTimeField": "clientLastUpdated", "localTimeField": "clientLastUpdated", "eq": equalPredicate}, remoteLocations, localLocations));
            };

            return getLocalReferralLocations(allReferralLocations)
                .then(_.partial(mergeAndSave, allReferralLocations))
                .then(referralLocationsRepository.upsert);
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
