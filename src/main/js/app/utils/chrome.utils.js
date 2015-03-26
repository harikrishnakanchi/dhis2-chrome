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

    var setAuthHeader = function(value) {
        return chrome.storage.local.set({
            "auth_header": value
        });
    };

    var getAuthHeader = function(callback) {
        chrome.storage.local.get("auth_header", callback);
    };

    return {
        "addListener": addListener,
        "sendMessage": sendMessage,
        "setAuthHeader": setAuthHeader,
        "getAuthHeader": getAuthHeader
    };
});
