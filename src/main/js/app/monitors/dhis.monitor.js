define(["properties", "platformUtils", "lodash"], function(properties, platformUtils, _) {
    return function($http, $log, $timeout, $rootScope, userPreferenceRepository) {
        var onlineEventHandlers = [];
        var offlineEventHandlers = [];
        var isDhisOnline;

        var dhisConnectivityCheck = function() {

            var hasRoles = function(allowedRoles, userRoles) {
                if (userRoles === undefined)
                    return false;

                return _.any(userRoles, function(userAuth) {
                    return _.contains(allowedRoles, userAuth.name);
                });
            };

            var sendHeadRequest = function (url) {
                return $http.head(url, {
                    "timeout": 1000 * properties.dhisPing.timeoutInSeconds
                }).then(function(response) {
                    $log.info("DHIS is accessible");
                    isDhisOnline = true;
                    platformUtils.sendMessage("dhisOnline");
                }).
                catch(function(response) {
                    $log.info("DHIS is not accessible");
                    isDhisOnline = false;
                    platformUtils.sendMessage("dhisOffline");
                });
            };

            var buildUrl = function (userPreferences) {
                var getRequestParams = "";
                if (userPreferences && userPreferences.selectedProject) {
                    if (hasRoles(['Coordination Level Approver'], userPreferences.userRoles)) {
                        var countryName;
                        if(userPreferences.selectedProject.parent)
                            countryName = userPreferences.selectedProject.parent.name;
                        getRequestParams = "&ctry=" + countryName;
                    } else {
                        var projCode = _.last(userPreferences.selectedProject.name.split(' - '));
                        getRequestParams = "&prj=" + projCode;
                    }
                }
                var praxisVersion = platformUtils.getPraxisVersion();
                return properties.dhisPing.url + "?" + (new Date()).getTime() + "&pv=" + praxisVersion +
                    "&pid=" + $rootScope.praxisUid + getRequestParams ;
            };

            return userPreferenceRepository.getCurrentUsersPreferences()
                .then(buildUrl)
                .then(sendHeadRequest);
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

        var onTimeoutOccurred = function() {
            if ($rootScope.timeoutEventReferenceCount === undefined)
                $rootScope.timeoutEventReferenceCount = 0;
            $rootScope.timeoutEventReferenceCount++;
            var timeoutDelay = properties.http.timeout + 5000;
            $timeout(function() {
                $rootScope.timeoutEventReferenceCount--;
            }, timeoutDelay);
        };

        var createAlarms = function () {
            $log.info("Registering dhis monitor alarm");
            platformUtils.createAlarm("dhisConnectivityCheckAlarm", {
                periodInMinutes: properties.dhisPing.retryIntervalInMinutes
            });
        };

        var start = function() {
            createAlarms();
            return dhisConnectivityCheck();
        };

        var stop = function() {
            platformUtils.clearAlarm("dhisConnectivityCheckAlarm");
            isDhisOnline = false;
            platformUtils.sendMessage('dhisOffline');
        };

        var isOnline = function() {
            return isDhisOnline;
        };

        var online = function(callBack) {
            if (!_.includes(onlineEventHandlers, callBack))
                onlineEventHandlers.push(callBack);
        };

        var offline = function(callBack) {
            if (!_.includes(offlineEventHandlers, callBack))
                offlineEventHandlers.push(callBack);
        };

        var checkNow = function() {
            return dhisConnectivityCheck();
        };

        var hasPoorConnectivity = function() {
            return $rootScope.timeoutEventReferenceCount !== undefined && $rootScope.timeoutEventReferenceCount > 0;
        };

        platformUtils.addListener("dhisOffline", onDhisOffline);
        platformUtils.addListener("dhisOnline", onDhisOnline);

        return {
            start: start,
            stop: stop,
            hasPoorConnectivity: hasPoorConnectivity,
            isOnline: isOnline,
            online: online,
            offline: offline,
            checkNow: checkNow,
            onTimeoutOccurred: onTimeoutOccurred
        };
    };
});
