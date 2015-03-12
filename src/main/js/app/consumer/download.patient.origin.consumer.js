define(['lodashUtils'], function(_) {
    return function(patientOriginService, patientOriginRepository, mergeBy) {
        var run = function(message) {
            return download().then(mergeAndSave);
        };

        var download = function() {
            return patientOriginService.getAll();
        };

        var mergeAndSave = function(remotePatientOrigins) {
            var projectIds = _.pluck(remotePatientOrigins, "orgUnit");

            return patientOriginRepository.findAll(projectIds)
                .then(_.curry(mergeBy.union)("origins", "orgUnit", remotePatientOrigins))
                .then(patientOriginRepository.upsert);
        };

        return {
            "run": run
        };
    };
});
