define([], function() {
    return function(dataValuesService) {
        this.run = function(message) {
            var payload = message.data;
            return payload.type === "upload" ? dataValuesService.sync(payload.data) : dataValuesService.sync();
        };
    };
});