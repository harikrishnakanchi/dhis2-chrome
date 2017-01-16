define(["properties"], function(properties) {
    return function($hustle, $q, $log, dispatcher) {
        var consumer;

        this.register = function() {
            $log.info("Registering consumer");
            return $q.when($hustle.registerConsumer(dispatcher.run, "dataValues", properties.queue.delay, properties.queue.retryDelayConfig)).then(function(data) {
                consumer = data;
                $log.info("registered consumer");
            });
        };

        this.startConsumer = function() {
            consumer && consumer.start();
            $log.info("started consumer");
        };

        this.stopConsumer = function() {
            consumer && consumer.stop();
            $log.info("stopped consumer");
        };
    };
});
