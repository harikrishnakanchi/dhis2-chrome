define(["lodash", "properties", "appSettingsUtils"], function(_, properties, appSettingsUtils) {
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
        return appSettingsUtils.upsert("authHeader", {
            "authHeader": value
        });
    };

    var getAuthHeader = function(callback) {
        var doCallback = function(storedObject) {
            console.log(storedObject, "storedObject");
            if (storedObject === null && properties.devMode) {
                console.log("not here");
                callback({
                    "authHeader": "Basic c2VydmljZS5hY2NvdW50OiFBQkNEMTIzNA=="
                });
                return;
            }
            if (storedObject === null)
                callback();
            else
                callback(storedObject.value.value);
        };
        appSettingsUtils.get("authHeader").then(doCallback);
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
