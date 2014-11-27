define(["moment"], function(moment) {
    return function(eventService, $q) {
        this.run = function(message) {
            return eventService.deleteEvent(message.data.data);
        };
    };
});