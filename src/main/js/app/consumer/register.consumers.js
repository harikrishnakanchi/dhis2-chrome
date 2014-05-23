define([], function() {
    return function($hustle, dataValuesConsumer) {
        this.run = function() {
            $hustle.registerConsumer(dataValuesConsumer.run, "dataValues");
        };
    };
});