define(["consumerRegistry", "angularMocks", "hustleModule", "utils", "properties"], function(ConsumerRegistry, mocks, hustleModule, utils, properties) {
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

            expect(hustle.registerConsumer).toHaveBeenCalledWith(dataValueConsumer.run, "dataValues", properties.queue.delay, properties.queue.retryDelayConfig);
        });

        it("should stop consumer", function() {
            spyOn(hustle, "registerConsumer").and.returnValue(utils.getPromise(q, consumer));

            consumerRegistry.register();
            scope.$apply();
            consumerRegistry.stopConsumer();

            expect(consumer.stop).toHaveBeenCalled();
        });

        it("should start consumer", function() {
            spyOn(hustle, "registerConsumer").and.returnValue(utils.getPromise(q, consumer));

            consumerRegistry.register();
            scope.$apply();
            consumerRegistry.startConsumer();

            expect(consumer.start).toHaveBeenCalled();
        });

    });
});
