define([], function() {
    return function(orgUnitGroupService) {
        this.run = function(message) {
            console.debug("Creating org unit groups: ", message.data.data);
            return orgUnitGroupService.upsert(message.data.data);
        };
    };
});