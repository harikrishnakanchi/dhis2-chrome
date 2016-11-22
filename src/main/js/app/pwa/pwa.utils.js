define(['lodash'], function(_) {
    var messageListeners = {};
    var alarms = {};

    var executeEventListener = function (message) {
        if (messageListeners[message] instanceof Function) {
            messageListeners[message].call({});
        }
    };
    var messageEvenHandler = function (event) {
        executeEventListener(event.data);
    };

    var fakeFunction = function () {

    };

    var addListener = function (message, callback) {
        messageListeners[message] = callback;
    };

    var sendMessage = function (message) {
        executeEventListener(message);
        self.worker.postMessage(message);
    };

    var createAlarmObject = function (name, duration) {
        var listeners = [];
        var interval;

        var addListener = function (callback) {
            listeners.push(callback);
        };

        var stop = function () {
            clearInterval(interval);
        };

        var executeListeners = function () {
            listeners.forEach(function (listener) {
                listener.call({});
            });
        };

        var start = function () {
            interval = setInterval(executeListeners, duration);
        };

        start();

        return {
            stop: stop,
            addListener: addListener
        };
    };
    
    var createAlarm = function (alarmName, options) {
        var durationInMilliseconds = options.periodInMinutes * 60 * 1000;
        alarms[alarmName] = alarms[alarmName] || createAlarmObject(alarmName, durationInMilliseconds);
    };

    var addAlarmListener = function (alarmName, callback) {
        return alarms[alarmName] && alarms[alarmName].addListener(callback);
    };

    var clearAlarm = function (alarmName) {
        if (alarms[alarmName]) {
            alarms[alarmName].stop();
            alarms[alarmName] = null;
        }
    };

    var init = function () {
        self.worker.addEventListener("message", messageEvenHandler);
    };

    return {
        addListener: addListener,
        sendMessage: sendMessage,
        setAuthHeader: fakeFunction,
        getAuthHeader: fakeFunction,
        createNotification: fakeFunction,
        getPraxisVersion: fakeFunction,
        getOS: fakeFunction,
        init: _.once(init),
        createAlarm: createAlarm,
        addAlarmListener: addAlarmListener,
        clearAlarm: clearAlarm
    };
});
