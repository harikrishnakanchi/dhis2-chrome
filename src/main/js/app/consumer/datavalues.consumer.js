define([], function() {
    return function(dataService) {
        this.run = function(message) {
            dataService.save(message.data);
        };
    };
});