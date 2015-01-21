define(['moment', "lodashUtils"], function(moment, _) {
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

            var isLocalDataStale = function(remoteProgram, localProgram) {
                return !localProgram || moment(remoteProgram.lastUpdated).isAfter(moment(localProgram.lastUpdated));
            };

            var merge = function(remoteProgram, localProgram) {
                return isLocalDataStale(remoteProgram, localProgram) ? programRepository.upsert(remoteProgram) : $q.when({});
            };

            return $q.all(_.map(remotePrograms, function(remoteProgram) {
                return programRepository.get(remoteProgram.id).then(_.curry(merge)(remoteProgram));
            }));
        };

    };
});
