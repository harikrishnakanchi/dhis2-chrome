define([], function() {
    return function(programService, programRepository, $q) {

        var retrieveFromIDB = function(programs) {
            return $q.all(_.map(programs, function(p) {
                return programRepository.get(p.id);
            }));
        };

        this.run = function(message) {
            var programs = _.isArray(message.data.data) ? message.data.data : [message.data.data];
            return retrieveFromIDB(programs).then(programService.upsert);
        };
    };
});
