define([], function() {
    return function() {
        var callbacks = {};
        var addListener = function(message, callback) {
            callbacks[message] = callback;
        };

        var sendMessage = function(message) {
            callbacks[message].call({});
        };

        return {
            "addListener": addListener,
            "sendMessage": sendMessage
        };
    };
});
