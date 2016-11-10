define(["lodash", "properties", "appSettingsUtils"], function(_, properties, appSettingsUtils) {
    var registerMessageCallback = function(messageName, callback) {
        return function(request, sender, sendResponse) {
            if (request === messageName)
                callback();

        };
    };

    var registerAlarmCallback = function(alarmName, callback) {
        return function(alarm) {
            if (alarm.name === alarmName)
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
            if (storedObject === null && properties.devMode) {
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

    var getPraxisVersion = function () {
        return chrome.runtime.getManifest().version;
    };

    var getOS = function () {
        return os;
    };

    var os;
    var init = function () {
        chrome.runtime.getPlatformInfo(function (platformInfo) {
            os = platformInfo.os;
        });
    };

    var createAlarm = function (name, options) {
        chrome.alarms.create(name, options);
    };

    var addAlarmListener = function (alarmName, callback) {
        chrome.alarms.onAlarm.addListener(registerAlarmCallback(alarmName, callback));
    };

    var clearAlarm = function (alarmName) {
        chrome.alarms.clear(alarmName);
    };

    return {
        addListener: addListener,
        sendMessage: sendMessage,
        setAuthHeader: setAuthHeader,
        getAuthHeader: getAuthHeader,
        createNotification: createNotification,
        getPraxisVersion: getPraxisVersion,
        getOS: getOS,
        init: _.once(init),
        createAlarm: createAlarm,
        addAlarmListener: addAlarmListener,
        clearAlarm: clearAlarm
    };
});
