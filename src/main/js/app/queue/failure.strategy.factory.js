define(["properties"], function(properties) {
    var create = function(hustle) {
        return function(message, data) {
            console.debug("retrying message: id", message.id, "releases:", message.releases);
            var isRequestTimeout = data && data.status === 0;
            if (isRequestTimeout) {
                return hustle.Queue.put(message.data, {
                    'priority': 1,
                    'tube': message.tube
                }).then(function() {
                    hustle.Queue.delete(message.id);
                });
            } else if (message.releases < properties.queue.maxretries) {
                return hustle.Queue.release(message.id);
            } else {
                return hustle.Queue.bury(message.id);
            }
        };
    };

    return {
        "create": create
    };
});