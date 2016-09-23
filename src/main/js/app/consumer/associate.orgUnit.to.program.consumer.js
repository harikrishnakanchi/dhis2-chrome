define(["lodash"], function(_) {
    return function(programService, $q) {
        var assignOrgUnitsToPrograms = function(orgUnitIds, programIds) {
            return _.reduce(programIds, function(wholePromise, programId){
                return _.reduce(orgUnitIds, function(eachPromise, orgUnitId) {
                    return eachPromise.then(function(){
                        return programService.assignOrgUnitToProgram(programId, orgUnitId);
                    });
                }, wholePromise);
            }, $q.when({}));
        };

        this.run = function(message) {
            return assignOrgUnitsToPrograms(message.data.data.orgUnitIds, message.data.data.programIds);
        };
    };
});
