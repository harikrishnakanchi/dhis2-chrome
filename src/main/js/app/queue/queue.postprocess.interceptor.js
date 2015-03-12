define(["properties", "chromeRuntime"], function(properties, chromeRuntime) {
    return function($log) {
        return {
            "onSuccess": function(job) {
                chromeRuntime.sendMessage({
                    "message": job.data.type + "Done",
                    "requestId": job.data.requestId
                });
            },
            "onFailure": function(job, data, hustleQueue) {
                chromeRuntime.sendMessage({
                    "message": job.data.type + "Failed",
                    "requestId": job.data.requestId
                });
                
                var isRequestTimeout = data && data.status === 0;
                if (isRequestTimeout) {
                    return hustleQueue.put(job.data, {
                        'priority': 1,
                        'tube': job.tube
                    }).then(function() {
                        hustleQueue.delete(job.id);
                    });
                } else if (job.releases < properties.queue.maxretries) {
                    $log.warn("Retry " + job.releases + " for job", job);
                    return hustleQueue.release(job.id);
                } else {
                    $log.warn("Burried job", job);
                    return hustleQueue.bury(job.id);
                }
            }
        };
    };
});