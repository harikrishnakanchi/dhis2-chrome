define(['lodash'], function(_) {
    var messageListeners = {};
    var alarms = {};
    var alarmListeners = {};

    var executeEventListener = function (message) {
        if (messageListeners[message.name] instanceof Function) {
            messageListeners[message.name].call({}, message.data);
        }
    };

    var fakeFunction = function () {

    };

    var addListener = function (message, callback) {
        messageListeners[message] = callback;
    };

    var sendMessage = function (messageName, data) {
        var payload = {
            name: messageName,
            data: data
        };
        executeEventListener(payload);
        self.worker.postMessage(payload);
    };

    var createNotification = function(title, message) {
        var requestPermission = (Notification.requestPermission && Notification.requestPermission()) || Promise.resolve("granted");
        requestPermission.then(function(permission) {
            if (permission === "granted") {
                var options = {
                    "icon": "/img/logo.png",
                    "body": message
                };
                var notification = new Notification(title, options);
                notification.addEventListener('click', function () {
                    notification.close();
                });
            }
            else if (permission !== "denied"){
                createNotification(title, message);
            }
        });
    };

    var createAlarmObject = function (name, duration) {
        var interval;

        var stop = function () {
            clearInterval(interval);
            interval = null;
        };

        var executeListeners = function () {
            var listeners = alarmListeners[name] || [];
            listeners.forEach(function (listener) {
                listener.call({});
            });
        };

        var start = function () {
            if (!interval) {
                interval = setInterval(executeListeners, duration);
            }
        };

        return {
            start: start,
            stop: stop
        };
    };

    var createAlarm = function (alarmName, options) {
        var durationInMilliseconds = options.periodInMinutes * 60 * 1000;
        alarms[alarmName] = alarms[alarmName] || createAlarmObject(alarmName, durationInMilliseconds);
        alarms[alarmName].start();
    };

    var addAlarmListener = function (alarmName, callback) {
        alarmListeners[alarmName] = alarmListeners[alarmName] || [];
        alarmListeners[alarmName].push(callback);
    };

    var clearAlarm = function (alarmName) {
        if (alarms[alarmName]) {
            alarms[alarmName].stop();
        }
    };

    var messageEventHandler = function (event) {
        executeEventListener(event.data);
    };

    var init = function () {
        self.worker.addEventListener("message", messageEventHandler);
    };

    return {
        addListener: addListener,
        sendMessage: sendMessage,
        setAuthHeader: fakeFunction,
        getAuthHeader: fakeFunction,
        createNotification: createNotification,
        getPraxisVersion: fakeFunction,
        getOS: fakeFunction,
        init: _.once(init),
        createAlarm: createAlarm,
        addAlarmListener: addAlarmListener,
        clearAlarm: clearAlarm
    };
});
