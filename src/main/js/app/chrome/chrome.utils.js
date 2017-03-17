define(['lodash'], function(_) {
    var messageListeners = {};

    var executeEventListener = function (message) {
        if (messageListeners[message.name] instanceof Function) {
            messageListeners[message.name].call({}, message.data);
        }
    };

    var registerAlarmCallback = function(alarmName, callback) {
        return function(alarm) {
            if (alarm.name === alarmName)
                callback();
        };
    };

    var addListener = function(message, callback) {
        messageListeners[message] = callback;
    };

    var sendMessage = function(messageName, data) {
        var payload = {
            name: messageName,
            data: data
        };
        executeEventListener(payload);
        chrome.runtime.sendMessage(payload);
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
        chrome.runtime.onMessage.addListener(executeEventListener);
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

    var uninstall = function () {
        chrome.management.uninstallSelf();
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
        clearAlarm: clearAlarm,
        uninstall: uninstall,
        platform: 'chrome'
    };
});
