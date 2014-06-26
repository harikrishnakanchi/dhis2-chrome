define([], function() {
    return function(orgUnitService) {
        this.run = function(message) {
            return orgUnitService.create(message.data.data);
        };
    };
});