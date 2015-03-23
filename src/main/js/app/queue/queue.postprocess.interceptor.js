define(["properties", "chromeRuntime"], function(properties, chromeRuntime) {
    return function($log) {
        var sendChromeMessage = function(job, messageType) {
            chromeRuntime.sendMessage({
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
                if (job.releases < properties.queue.maxretries) {
                    $log.warn("Retry " + job.releases + " for job", job);
                    return true;
                } else {
                    $log.warn("Burried job", job);
                    return false;
                }
            },
            "onFailure": function(job, data, hustleQueue) {
                sendChromeMessage(job, "Failed");
            }
        };
    };
});
