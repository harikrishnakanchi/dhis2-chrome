define(["properties", "lodash"], function(properties, _) {
    return function($http) {
        var onlineEventHandlers = [];
        var offlineEventHandlers = [];
        var isDhisOnline = false;


        var registerAlarmCallback = function(alarmName, callback) {
            return function(alarm) {
                if (alarm.name === alarmName)
                    callback();
            };
        };

        var registerMessageCallback = function(messageName, callback) {
            return function(request, sender, sendResponse) {
                if (request === messageName)
                    callback();
            };
        };

        var dhisConnectivityCheck = function() {

            var pingUrl = properties.dhisPing.url + "?" + (new Date()).getTime();

            return $http.head(pingUrl, {
                "timeout": 1000 * properties.dhisPing.timeoutInSeconds
            }).then(function(response) {
                console.log("DHIS is accessible");
                isDhisOnline = true;
                chrome.runtime.sendMessage("dhisOnline");
            }).
            catch (function(response) {
                console.log("DHIS is not accessible");
                isDhisOnline = false;
                chrome.runtime.sendMessage("dhisOffline");
            });
        };

        var onDhisOnline = function() {
            _.each(onlineEventHandlers, function(handler) {
                handler.call({});
            });
        };

        var onDhisOffline = function() {
            _.each(offlineEventHandlers, function(handler) {
                handler.call({});
            });
        };

        var start = function() {

            chrome.alarms.create("dhisConnectivityCheckAlarm", {
                periodInMinutes: properties.dhisPing.retryIntervalInMinutes
            });
            chrome.alarms.onAlarm.addListener(registerAlarmCallback("dhisConnectivityCheckAlarm", dhisConnectivityCheck));

            chrome.runtime.onMessage.addListener(registerMessageCallback("dhisOnline", onDhisOnline));
            chrome.runtime.onMessage.addListener(registerMessageCallback("dhisOffline", onDhisOffline));

            return dhisConnectivityCheck();
        };

        var stop = function() {
            chrome.alarms.clear("dhisConnectivityCheckAlarm");
        };

        var isOnline = function() {
            return isDhisOnline;
        };

        var online = function(callBack) {
            if (onlineEventHandlers)
                onlineEventHandlers.push(callBack);
        };

        var offline = function(callBack) {
            if (offlineEventHandlers)
                offlineEventHandlers.push(callBack);
        };

        var checkNow = function() {
            return dhisConnectivityCheck();
        };

        return {
            "start": start,
            "stop": stop,
            "isOnline": isOnline,
            "online": online,
            "offline": offline,
            "checkNow": checkNow
        };
    };
});