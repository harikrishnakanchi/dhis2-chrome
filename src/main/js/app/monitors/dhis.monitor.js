define(["properties", "chromeUtils", "lodash"], function(properties, chromeUtils, _) {
    return function($http, $log) {
        var onlineEventHandlers = [];
        var offlineEventHandlers = [];
        var isDhisOnline;


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
                $log.info("DHIS is accessible");
                isDhisOnline = true;
                chromeUtils.sendMessage("dhisOnline");
            }).
            catch(function(response) {
                $log.info("DHIS is not accessible");
                isDhisOnline = false;
                chromeUtils.sendMessage("dhisOffline");
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

        var createAlarms = function() {
            if (chrome.alarms) {
                $log.info("Registering dhis monitor alarm");
                chrome.alarms.create("dhisConnectivityCheckAlarm", {
                    periodInMinutes: properties.dhisPing.retryIntervalInMinutes
                });
                chrome.alarms.onAlarm.addListener(registerAlarmCallback("dhisConnectivityCheckAlarm", dhisConnectivityCheck));
            }
        };

        var start = function() {
            createAlarms();
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

        chromeUtils.addListener("dhisOffline", onDhisOffline);
        chromeUtils.addListener("dhisOnline", onDhisOnline);
        chromeUtils.addListener("checkNow", checkNow);

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
