define(['moment', 'mergeByUnion', 'lodashUtils', 'mergeByLastUpdated'], function(moment, mergeByUnion, _, mergeByLastUpdated) {
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
                .then(_.curry(mergeByUnion)("organisationUnits", remotePrograms))
                .then(_.curry(mergeByLastUpdated)(undefined, remotePrograms))
                .then(programRepository.upsertDhisDownloadedData);
        };
    };
});
