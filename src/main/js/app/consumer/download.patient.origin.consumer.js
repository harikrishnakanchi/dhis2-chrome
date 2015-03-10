define(['lodashUtils', 'mergeBy'], function(_, mergeBy) {
    return function(patientOriginService, patientOriginRepository) {
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
            var eq = function(item1, item2) {
                return item1.key && item1.key === item2.key;
            };

            var mergeOpts = {
                eq: eq,
                remoteTimeField: "value.clientLastUpdated",
                localTimeField: "value.clientLastUpdated"
            };
            return patientOriginRepository.findAll(projectIds)
                .then(_.curry(mergeBy.lastUpdated)(mergeOpts, remoteSettings))
                .then(patientOriginRepository.upsert);
        };

        return {
            "run": run
        };
    };
});
