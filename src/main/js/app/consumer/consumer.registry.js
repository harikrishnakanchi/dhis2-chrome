define(["properties"], function(properties) {
    return function($hustle, $q, $log, dispatcher) {
        var allConsumers = [];

        this.register = function() {
            $log.info("Registering allconsumers");
            return $q.all([$hustle.registerConsumer(dispatcher.run, "dataValues", properties.queue.delay, properties.queue.retryDelayConfig)]).then(function(data) {
                allConsumers = data;
                $log.info("registered allconsumers");
            });
        };

        this.startAllConsumers = function() {
            for (var index in allConsumers) {
                allConsumers[index].start();
            }
            $log.info("started allconsumers");
        };

        this.stopAllConsumers = function() {
            for (var index in allConsumers) {
                allConsumers[index].stop();
            }
            $log.info("stopped allconsumers");
        };
    };
});
