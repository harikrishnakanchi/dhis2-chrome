define(["properties", "chromeUtils", "lodash"], function(properties, chromeUtils, _) {
    return function($log, ngI18nResourceBundle) {
        var getResourceBundle = function(locale) {
            return ngI18nResourceBundle.get({
                "locale": locale
            }).then(function(data) {
                return data.data;
            });
        };

        var getRetryDelayInHours = function(retryNumber) {
            var delayInMs = properties.queue.retryDelayConfig[retryNumber];
            var delayinHrs = delayInMs / (1000 * 60 * 60);
            return delayinHrs.toString();
        };

        var notifyUser = function(job, data) {
            if (data && data.status === 401) {
                getResourceBundle(job.data.locale).then(function(data) {
                    var resourceBundle = data;
                    chromeUtils.createNotification(resourceBundle.notificationTitle, resourceBundle.productKeyExpiredMessage);
                    chromeUtils.sendMessage("dhisOffline");
                    chromeUtils.sendMessage("productKeyExpired");
                });
            } else if (job.releases === 2) {
                getResourceBundle(job.data.locale).then(function(data) {
                    var resourceBundle = data;
                    var notificationMessage = resourceBundle.failedToLabel + job.data.desc + resourceBundle.notificationRetryMessagePrefix + getRetryDelayInHours(3) + resourceBundle.notificationRetryMessageSuffix;
                    chromeUtils.createNotification(resourceBundle.notificationTitle, notificationMessage);
                });
            } else if (job.releases === properties.queue.maxretries) {
                getResourceBundle(job.data.locale).then(function(data) {
                    var resourceBundle = data;
                    var notificationMessage = resourceBundle.failedToLabel + job.data.desc + resourceBundle.notificationAbortRetryMessageSuffix;
                    chromeUtils.createNotification(resourceBundle.notificationTitle, notificationMessage);
                });
            }
        };

        var sendChromeMessage = function(job, messageType) {
            chromeUtils.sendMessage({
                "message": job.data.type + messageType,
                "requestId": job.data.requestId
            });
        };

        return {
            "onSuccess": function(job) {
                sendChromeMessage(job, "Done");
            },
            "shouldRetry": function(job, data) {
                sendChromeMessage(job, "Failed");

                notifyUser(job, data);

                if (_.contains(properties.queue.skipRetryMessages, job.data.type)) {
                    return false;
                }

                if (job.releases < properties.queue.maxretries) {
                    $log.warn("Retry " + job.releases + " for job", job);
                    return true;
                }

                $log.warn("Burried job", job);
                return false;
            },
            "onFailure": function(job, data, hustleQueue) {
                sendChromeMessage(job, "Failed");
            }
        };
    };
});
