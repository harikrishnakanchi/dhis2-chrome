define([], function() {
    return function(metadataService) {
        this.run = function(message) {
            return metadataService.sync();
        };
    };
});
