define(['lodash'], function(_) {
    var messageListeners = {};

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
        createAlarm: fakeFunction,
        addAlarmListener: fakeFunction,
        clearAlarm: fakeFunction
    };
});
