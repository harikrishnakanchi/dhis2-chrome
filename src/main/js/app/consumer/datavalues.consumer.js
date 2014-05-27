define([], function() {
    return function(dataService, dataValuesService) {
        this.run = function(message) {
            var payload = message.data;
            var ops = {
                "upload": dataService.save,
                "download": dataValuesService.sync
            };
            var operation = ops[payload.type] || function() {};
            operation(payload.data);
        };
    };
});