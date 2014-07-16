define([], function() {
    return function($hustle, $q, dispatcher) {
        var allConsumers = [];

        this.register = function() {
            console.debug("registering allconsumers", allConsumers);
            return $q.all([$hustle.registerConsumer(dispatcher.run, "dataValues")]).then(function(data) {
                allConsumers = data;
                console.debug("registered allconsumers", allConsumers);
            });
        };

        this.startAllConsumers = function() {
            for (var index in allConsumers) {
                allConsumers[index].start();
            }
            console.debug("started allconsumers", allConsumers);
        };

        this.stopAllConsumers = function() {
            for (var index in allConsumers) {
                allConsumers[index].stop();
            }
            console.debug("stopped allconsumers", allConsumers);
        };
    };
});