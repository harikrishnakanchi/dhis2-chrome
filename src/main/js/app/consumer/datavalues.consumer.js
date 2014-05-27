define([], function() {
    return function(dataService) {
        this.run = function(message) {
            var payload = message.data;
            if (payload.type === "upload") {
                dataService.save(payload.data);
            }
        };
    };
});