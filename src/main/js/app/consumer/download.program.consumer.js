define(['moment', 'mergeByUnion', 'lodashUtils', 'mergeByLastUpdated'], function(moment, mergeByUnion, _, mergeByLastUpdated) {
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
                return programRepository.get(remoteProgram.id).then(function(programFromDb) {
                    var mergedProgram = mergeByLastUpdated(remoteProgram, programFromDb);

                    var mergedOrgUnits = mergeByUnion("organisationUnits", remoteProgram, programFromDb);
                    if (mergedOrgUnits) {
                        mergedProgram = mergedProgram || remoteProgram;
                        mergedProgram.organisationUnits = mergedOrgUnits.organisationUnits;
                    }

                    if (mergedProgram)
                        return programRepository.upsert(mergedProgram);

                    return $q.when({});
                });
            }));
        };
    };
});
