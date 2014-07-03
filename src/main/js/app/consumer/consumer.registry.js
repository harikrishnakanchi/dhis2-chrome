define([], function() {
    return function($hustle, $q, dispatcher) {
        var allConsumers = [];

        this.register = function() {
            $q.all([$hustle.registerConsumer(dispatcher.run, "dataValues")]).then(function(data) {
                allConsumers = data;
                for (var index in allConsumers) {
                    allConsumers[index].start();
                }
            });
        };

        this.deregister = function() {
            for (var index in allConsumers) {
                allConsumers[index].stop();
            }
        };
    };
});