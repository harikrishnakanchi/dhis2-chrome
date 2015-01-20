define([], function() {
    return function(programService) {
        this.run = function(message) {
            console.debug("Associating programs with org units: ", message.data.data);
            return programService.upload(message.data.data);
        };
    };
});