define(['moment', 'mergeByUnion', 'lodashUtils'], function(moment, mergeByUnion, _) {
    return function(programService, programRepository, changeLogRepository, $q) {
        this.run = function(message) {
            console.debug("Syncing programs: ", message.data.data);
            return download().then(mergeAll).then(updateChangeLog);
        };

        var updateChangeLog = function() {
            return changeLogRepository.upsert("programs", moment().toISOString());
        };

        var download = function() {
            return changeLogRepository.get("programs").then(programService.getAll);
        };

        var mergeAll = function(remotePrograms) {
            return $q.all(_.map(remotePrograms, function(remoteProgram) {
                return programRepository.get(remoteProgram.id)
                    .then(_.curry(mergeByUnion)("organisationUnits", remoteProgram))
                    .then(function(mergedProgram) {
                        return mergedProgram ? programRepository.upsert(mergedProgram) : $q.when([]);
                    });
            }));
        };
    };
});
