define(['lodashUtils'], function(_) {
    return function(patientOriginService, patientOriginRepository, mergeBy) {
        var run = function(message) {
            return download().then(mergeAndSave);
        };

        var download = function() {
            return patientOriginService.getAll();
        };

        var mergeAndSave = function(remoteSettings) {
            var projectIds = _.map(remoteSettings, function(remoteSetting) {
                return remoteSetting.key;
            });

            return patientOriginRepository.findAll(projectIds)
                .then(_.curry(mergeBy.union)("origins", "orgUnit", remoteSettings))
                .then(patientOriginRepository.upsert);
        };

        return {
            "run": run
        };
    };
});
