define(["lodash", "properties"], function(_, properties) {
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
            "authHeader": value
        });
    };

    var getAuthHeader = function(callback) {
        var doCallback = function(storedObject) {
            if (storedObject.authHeader === undefined && properties.devMode) {
                callback({
                    "authHeader": "Basic c2VydmljZS5hY2NvdW50OiFBQkNEMTIzNA=="
                });
                return;
            }
            callback(storedObject);
        };
        chrome.storage.local.get("authHeader", doCallback);
    };

    var createNotification = function(title, message) {
        var options = {
            "type": "basic",
            "iconUrl": "/img/logo.png",
            "title": title,
            "message": message
        };
        chrome.notifications.create(_.random(1000000).toString(), options, function(notificationId) {
            return notificationId;
        });
    };

    return {
        "addListener": addListener,
        "sendMessage": sendMessage,
        "setAuthHeader": setAuthHeader,
        "getAuthHeader": getAuthHeader,
        "createNotification": createNotification
    };
});
