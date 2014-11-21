define(["moment"], function(moment) {
    return function(eventService, programEventRepository, $q) {

    	var changeEventLocalStatus = function(eventPayload){
            var updatedEvents  = _.map(eventPayload.events, function(event){
                return _.omit(event, "localStatus");
            });

            return programEventRepository.upsert({"events": updatedEvents});
    	};

    	var uploadEventData = function(eventPayload){
    		return eventService.upsertEvents(eventPayload).then(changeEventLocalStatus);
    	};

        this.run = function(message) {
            return uploadEventData(message.data.data);
        };
    };
});