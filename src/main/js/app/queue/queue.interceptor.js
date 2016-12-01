define(["properties", "platformUtils", "interpolate", "moment", "lodash"], function(properties, platformUtils, interpolate, moment, _) {
    return function($log, ngI18nResourceBundle, dataRepository, dataSyncFailureRepository, hustleMonitor) {
        var getResourceBundle = function(locale) {
            return ngI18nResourceBundle.get({
                "locale": locale
            }).then(function(data) {
                return data.data;
            });
        };

        var getRetryDelay = function(retryNumber, locale) {
            var delayInMs = properties.queue.retryDelayConfig[retryNumber];
            return moment.duration(delayInMs).locale(locale || 'en').humanize();
        };

        var notifyUser = function(job, data) {
            var getCurrentDateTime = function() {
                return moment().format("YYYY-MM-DD HH:mm") + "\n";
            };

            if (data && data.status === 401) {
                getResourceBundle(job.data.locale).then(function(data) {
                    var resourceBundle = data;
                    platformUtils.createNotification(resourceBundle.notificationTitle, getCurrentDateTime() + resourceBundle.productKeyExpiredMessage);
                    platformUtils.sendMessage("dhisOffline");
                    platformUtils.sendMessage("productKeyExpired");
                });
            } else if (job.releases === 2) {
                getResourceBundle(job.data.locale).then(function(resourceBundle) {
                    var notificationMessage = getCurrentDateTime();
                    notificationMessage += interpolate(resourceBundle.notificationRetryMessage, {
                        job_description: job.data.desc || resourceBundle.downloadDataDesc,
                        retry_delay: getRetryDelay(3, job.data.locale)
                    });
                    platformUtils.createNotification(resourceBundle.notificationTitle, notificationMessage);
                });
            } else if (job.releases === properties.queue.maxretries) {
                getResourceBundle(job.data.locale).then(function(resourceBundle) {
                    var notificationMessage = getCurrentDateTime();
                    notificationMessage += interpolate(resourceBundle.notificationAbortRetryMessage, {
                        job_description: job.data.desc || resourceBundle.downloadDataDesc
                    });
                    platformUtils.createNotification(resourceBundle.notificationTitle, notificationMessage);
                });
            }
        };

        return {
            onSuccess: function(job) {
                hustleMonitor.checkHustleQueueCount();
            },
            onFailure: function(job, failureMessage) {
                hustleMonitor.checkHustleQueueCount();
            },
            onPublish: function(job) {
                hustleMonitor.checkHustleQueueCount();
            },
            shouldRetry: function(job, data) {
                notifyUser(job, data);

                if (_.contains(properties.queue.skipRetryMessages, job.data.type)) {
                    return false;
                }

                if (job.releases < properties.queue.maxretries) {
                    $log.warn("Retry " + job.releases + " for job", job);
                    return true;
                }

                $log.warn("Buried job", job);
                if(job.data.type == 'syncModuleDataBlock') {
                    var jobParameters = job.data.data;

                    dataSyncFailureRepository.add(jobParameters.moduleId, jobParameters.period).then(function (){
                        $log.warn("Flagged that sync failed for: ", [jobParameters.moduleId, jobParameters.period]);
                    });
                }
                return false;
            }
        };
    };
});
