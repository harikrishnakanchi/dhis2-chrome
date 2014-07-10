define([], function() {
    return function($hustle, $q, dispatcher) {
        var allConsumers = [];

        this.register = function() {
            console.debug("registering allconsumers", allConsumers);
            $q.all([$hustle.registerConsumer(dispatcher.run, "dataValues")]).then(function(data) {
                allConsumers = data;
                for (var index in allConsumers) {
                    allConsumers[index].start();
                }
                console.debug("registered allconsumers", allConsumers);
            });
        };

        this.deregister = function() {
            for (var index in allConsumers) {
                allConsumers[index].stop();
            }
            console.debug("deregistering allconsumers", allConsumers);
        };
    };
});