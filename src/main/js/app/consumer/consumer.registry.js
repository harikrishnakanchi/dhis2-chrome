define([], function() {
    return function($hustle, $q, dispatcher) {
        var allConsumers = [];

        this.register = function() {
            if (allConsumers.length === 0) {
                $q.all([$hustle.registerConsumer(dispatcher.run, "dataValues")]).then(function(data) {
                    allConsumers = data;
                });
            } else {
                for (var index in allConsumers) {
                    allConsumers[index].start();
                }
            }
        };

        this.deregister = function() {
            for (var index in allConsumers) {
                allConsumers[index].stop();
            }
        };
    };
});