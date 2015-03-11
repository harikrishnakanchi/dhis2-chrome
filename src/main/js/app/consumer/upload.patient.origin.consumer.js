define([], function() {
    return function(patientOriginService, patientOriginRepository) {
        var run = function(message) {
            var data = message.data.data;
            return patientOriginRepository.get(data.orgUnit).then(patientOriginService.upsert);
        };

        return {
            "run": run
        };
    };
});
