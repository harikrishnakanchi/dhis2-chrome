define(['moment', 'mergeBy', 'lodashUtils'], function(moment, mergeBy, _) {
    return function(programService, programRepository, changeLogRepository, $q) {
        this.run = function(message) {
            return download()
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("programs", moment().toISOString());
        };

        var download = function() {
            return changeLogRepository.get("programs").then(programService.getAll);
        };

        var mergeAndSave = function(remotePrograms) {
            var programIds = _.pluck(remotePrograms, "id");
            return programRepository.findAll(programIds)
                .then(_.curry(mergeBy.union)("organisationUnits", remotePrograms))
                .then(_.curry(mergeBy.lastUpdated)(remotePrograms))
                .then(programRepository.upsertDhisDownloadedData);
        };
    };
});
