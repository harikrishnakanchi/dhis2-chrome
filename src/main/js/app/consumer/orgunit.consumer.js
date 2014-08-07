define([], function() {
    return function(orgUnitService) {
        this.run = function(message) {
            console.debug("Creating org unit: ", message.data.data);
            return orgUnitService.upsert(message.data.data);
        };
    };
});