define(["properties"], function(properties) {
    var create = function(hustle) {
        return function(message) {
            if (message.releases < properties.queue.maxretries) {
                hustle.Queue.release(message.id);
            } else {
                hustle.Queue.bury(message.id);
            }
        };
    };

    return {
        "create": create
    };
});