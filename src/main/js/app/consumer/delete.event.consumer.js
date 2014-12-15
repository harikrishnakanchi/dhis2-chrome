define(["moment"], function(moment) {
    return function(eventService, programEventRepository, $q) {
        this.run = function(message) {
            return eventService.deleteEvent(message.data.data).then(function() {
                return programEventRepository.delete(message.data.data);
            });
        };
    };
});
