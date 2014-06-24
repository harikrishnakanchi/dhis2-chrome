define(["properties", "chromeRuntime", "lodash"], function(properties, chromeRuntime, _) {
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

        var dhisConnectivityCheck = function() {

            var pingUrl = properties.dhisPing.url + "?" + (new Date()).getTime();

            return $http.head(pingUrl, {
                "timeout": 1000 * properties.dhisPing.timeoutInSeconds
            }).then(function(response) {
                console.log("DHIS is accessible");
                isDhisOnline = true;
                chromeRuntime.sendMessage("dhisOnline");
            }).
            catch (function(response) {
                console.log("DHIS is not accessible");
                isDhisOnline = false;
                chromeRuntime.sendMessage("dhisOffline");
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

            if (chrome.alarms) {
                chrome.alarms.create("dhisConnectivityCheckAlarm", {
                    periodInMinutes: properties.dhisPing.retryIntervalInMinutes
                });
                chrome.alarms.onAlarm.addListener(registerAlarmCallback("dhisConnectivityCheckAlarm", dhisConnectivityCheck));
            }

            chromeRuntime.addListener("dhisOffline", onDhisOffline);
            chromeRuntime.addListener("dhisOnline", onDhisOnline);

            return dhisConnectivityCheck();
        };

        var stop = function() {
            if (chrome.alarms) {
                chrome.alarms.clear("dhisConnectivityCheckAlarm");
            }
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