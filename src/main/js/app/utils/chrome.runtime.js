define([], function() {

    var registerMessageCallback = function(messageName, callback) {
        return function(request, sender, sendResponse) {
            if (request === messageName)
                callback();
        };
    };

    var addListener = function(message, callback) {
        chrome.runtime.onMessage.addListener(registerMessageCallback(message, callback));
    };

    var sendMessage = function(message) {
        chrome.runtime.sendMessage(message);
    };

    return {
        "addListener": addListener,
        "sendMessage": sendMessage
    };
});