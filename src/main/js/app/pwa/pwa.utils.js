define(['properties', 'platformConfig', 'lodash', 'indexedDBLogger'], function(properties, pwaConfig, _, indexedDBLogger) {
    var messageListeners = {};
    var alarms = {};
    var alarmListeners = {};

    var executeEventListener = function (message) {
        if (messageListeners[message.name] instanceof Function) {
            messageListeners[message.name].call({}, message.data);
        }
    };

    var getPraxisVersion = function () {
        return properties.praxis.version;
    };

    var getOS = function () {
        return _.includes(window.navigator.platform, 'Win') ? 'win' : '';
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

    var createNotification = function(title, message, callback) {
        var requestPermission = (Notification.requestPermission && Notification.requestPermission()) || Promise.resolve("granted");
        requestPermission.then(function(permission) {
            if (permission === "granted") {
                var options = {
                    "icon": self.basePath + "img/logo.png",
                    "body": message
                };
                var notification = new Notification(title, options);
                notification.addEventListener('click', function () {
                    if(callback) callback();
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

    var uninstall = function (injector) {
        var clearCacheStorage = function () {
            return window.caches.keys().then(function(keys) {
                return Promise.all(_.map(keys, function (key) {
                    return window.caches.delete(key);
                }));
            });
        };

        var unregisterServiceWorker = function() {
            return navigator.serviceWorker.getRegistrations().then(function(registrations) {
                return Promise.all(_.map(registrations, function (registration) {
                    return registration.unregister();
                }));
            });
        };

        var terminateWebWorker = function () {
            self.worker.terminate();
        };

        var clearIndexedDB = function () {
            var deleteIDBDatabase = function (databaseName) {
                return new Promise(function (resolve, reject) {
                    var DBDeleteRequest = window.indexedDB.deleteDatabase(databaseName);
                    DBDeleteRequest.onerror = reject;
                    DBDeleteRequest.onsuccess = resolve;
                    DBDeleteRequest.onblocked = function(event) {
                        console.log('onblocked: ', event, databaseName);
                    };
                });
            };

            var closeAllDatabaseConnections = function () {
                var getAngularService = angular.element(document.getElementById('praxis')).injector().get;

                indexedDBLogger.closeDB();

                var praxisDB = getAngularService('$indexedDB');
                praxisDB.closeDB();

                var hustle = getAngularService('$hustle');
                hustle.wipe();
            };

            closeAllDatabaseConnections();

            var databaseNames = ['hustle', pwaConfig.praxis.dbName, pwaConfig.praxis.dbForLogs];
            return Promise.all(_.map(databaseNames, deleteIDBDatabase));
        };

        var clearSessionStorage = function () {
            window.sessionStorage.clear();
        };

        return clearCacheStorage()
            .then(unregisterServiceWorker)
            .then(terminateWebWorker)
            .then(clearIndexedDB)
            .then(clearSessionStorage);
    };

    var init = function () {
        self.worker.addEventListener("message", messageEventHandler);
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
        platform: 'pwa'
    };
});
