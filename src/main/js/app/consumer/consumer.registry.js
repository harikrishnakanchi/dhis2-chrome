define([], function() {
    return function($hustle, $q, dispatcher) {
        var allConsumers = [];

        this.register = function() {
            console.log("Registering allconsumers");
            return $q.all([$hustle.registerConsumer(dispatcher.run, "dataValues")]).then(function(data) {
                allConsumers = data;
                console.log("registered allconsumers", allConsumers);
            });
        };

        this.startAllConsumers = function() {
            for (var index in allConsumers) {
                allConsumers[index].start();
            }
            console.log("started allconsumers", allConsumers);
        };

        this.stopAllConsumers = function() {
            for (var index in allConsumers) {
                allConsumers[index].stop();
            }
            console.log("stopped allconsumers", allConsumers);
        };
    };
});
