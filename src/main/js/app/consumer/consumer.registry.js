define([], function() {
    return function($hustle, $q, dataValuesConsumer) {
        var allConsumers = [];

        this.register = function() {
            if (allConsumers.length === 0) {
                $q.all([$hustle.registerConsumer(dataValuesConsumer.run, "dataValues")]).then(function(data) {
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