define(['lodash'], function(_) {
    var registerMessageCallback = function(messageName, callback) {
        return function(message) {
            if (message.name === messageName)
                callback(message.data);
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

    var sendMessage = function(messageName, data) {
        chrome.runtime.sendMessage({
            name: messageName,
            data: data
        });
    };

    var createNotification = function (title, message, callBack) {
        var options = {
            "type": "basic",
            "iconUrl": self.basePath + "img/logo.png",
            "title": title,
            "message": message
        };
        var notificationId = _.random(1000000).toString();
        chrome.notifications.create(notificationId, options, function (notificationId) {
            return notificationId;
        });

        if (callBack) {
            var registerNotificationCallBack = function (registeredNotificationId, callBack) {
                return function (notificationId) {
                    if ((notificationId == registeredNotificationId) && callBack) {
                        callBack();
                    }
                };
            };
            chrome.notifications.onClicked.addListener(registerNotificationCallBack(notificationId, callBack));
        }
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
        createNotification: createNotification,
        getPraxisVersion: getPraxisVersion,
        getOS: getOS,
        init: _.once(init),
        createAlarm: createAlarm,
        addAlarmListener: addAlarmListener,
        clearAlarm: clearAlarm
    };
});
