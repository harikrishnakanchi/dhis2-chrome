define(["properties", "chromeUtils", "moment", "lodash"], function(properties, chromeUtils, moment, _) {
    return function($log, ngI18nResourceBundle, dataRepository, approvalDataRepository, orgUnitRepository) {
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
            var getCurrentDateTime = function() {
                return moment().format("MM-DD-YYYY HH:mm") + "\n";
            };

            if (data && data.status === 401) {
                getResourceBundle(job.data.locale).then(function(data) {
                    var resourceBundle = data;
                    chromeUtils.createNotification(resourceBundle.notificationTitle, getCurrentDateTime() + resourceBundle.productKeyExpiredMessage);
                    chromeUtils.sendMessage("dhisOffline");
                    chromeUtils.sendMessage("productKeyExpired");
                });
            } else if (job.releases === 2) {
                getResourceBundle(job.data.locale).then(function(data) {
                    var resourceBundle = data;
                    var notificationMessage = getCurrentDateTime();
                    notificationMessage += resourceBundle.failedToLabel + job.data.desc + resourceBundle.notificationRetryMessagePrefix + getRetryDelayInHours(3) + resourceBundle.notificationRetryMessageSuffix;
                    chromeUtils.createNotification(resourceBundle.notificationTitle, notificationMessage);
                });
            } else if (job.releases === properties.queue.maxretries) {
                getResourceBundle(job.data.locale).then(function(data) {
                    var resourceBundle = data;
                    var notificationMessage = getCurrentDateTime() + resourceBundle.failedToLabel + job.data.desc + resourceBundle.notificationAbortRetryMessageSuffix;
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

                $log.warn("Buried job", job);
                //CAN BE REMOVED AFTER V6.0 HAS BEEN RELEASED
                if(job.data.type == 'uploadDataValues') {
                    dataRepository.setLocalStatus(job.data.data, "FAILED_TO_SYNC");
                }
                if(job.data.type == 'syncModuleDataBlock') {
                    var jobParameters = job.data.data;

                    orgUnitRepository.findAllByParent(jobParameters.moduleId).then(function(originOrgUnits) {
                        var originOrgUnitIds = _.pluck(originOrgUnits, 'id');

                        dataRepository.flagAsFailedToSync([jobParameters.moduleId].concat(originOrgUnitIds), jobParameters.period).then(function() {
                            approvalDataRepository.flagAsFailedToSync(jobParameters.moduleId, jobParameters.period).then(function() {
                                $log.warn("Flagged that sync failed for: ", [jobParameters.moduleId, jobParameters.period]);
                            });
                        });
                    });
                }
                return false;
            },
            "onFailure": function(job, data, hustleQueue) {
                sendChromeMessage(job, "Failed");
            }
        };
    };
});
