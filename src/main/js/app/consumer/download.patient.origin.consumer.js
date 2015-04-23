define(['lodashUtils'], function(_) {
    return function(patientOriginService, patientOriginRepository, mergeBy) {
        var run = function(message) {
            return download().then(mergeAndSave);
        };

        var download = function() {
            return patientOriginService.getAll();
        };

        var mergeAndSave = function(remotePatientOrigins) {
            var opUnitIds = _.pluck(remotePatientOrigins, "orgUnit");

            return patientOriginRepository.findAll(opUnitIds).then(function(localPatientOrigins) {
                return _.forEach(remotePatientOrigins, function(remotePatientOrigin) {
                    var originFoundLocally = _.find(localPatientOrigins, {
                        "orgUnit": remotePatientOrigin.orgUnit
                    });

                    if (originFoundLocally) {
                        var updatedOrigins = mergeBy.lastUpdated({}, remotePatientOrigin.origins, originFoundLocally.origins);
                        remotePatientOrigin.origins = updatedOrigins;
                        return patientOriginRepository.upsert(remotePatientOrigin);
                    } else {
                        return patientOriginRepository.upsert(remotePatientOrigin);
                    }
                });
            });
        };

        return {
            "run": run
        };
    };
});
