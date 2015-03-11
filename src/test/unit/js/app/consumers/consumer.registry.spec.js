define(["consumerRegistry", "angularMocks", "hustleModule", "utils"], function(ConsumerRegistry, mocks, hustleModule, utils) {
    describe("register consumers", function() {
        var hustle, consumerRegistry, dataValueConsumer, consumer, q, scope;
        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($hustle, $q, $log, $rootScope) {
            hustle = $hustle;
            dataValueConsumer = {
                "run": function() {}
            };
            consumer = {
                stop: jasmine.createSpy(),
                start: jasmine.createSpy()
            };
            q = $q;
            scope = $rootScope.$new();
            consumerRegistry = new ConsumerRegistry($hustle, $q, $log, dataValueConsumer);
        }));

        it("should register and start consumers", function() {
            spyOn(hustle, "registerConsumer");

            consumerRegistry.register();

            expect(hustle.registerConsumer).toHaveBeenCalledWith(dataValueConsumer.run, "dataValues");
        });

        it("should stop all consumers", function() {
            spyOn(hustle, "registerConsumer").and.returnValue(utils.getPromise(q, consumer));

            consumerRegistry.register();
            scope.$apply();
            consumerRegistry.stopAllConsumers();

            expect(consumer.stop).toHaveBeenCalled();
        });

        it("should start all consumers", function() {
            spyOn(hustle, "registerConsumer").and.returnValue(utils.getPromise(q, consumer));

            consumerRegistry.register();
            scope.$apply();
            consumerRegistry.startAllConsumers();

            expect(consumer.start).toHaveBeenCalled();
        });

    });
});