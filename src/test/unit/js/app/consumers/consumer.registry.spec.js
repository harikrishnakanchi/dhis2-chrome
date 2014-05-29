define(["consumerRegistry", "angularMocks", "hustleModule", "utils"], function(ConsumerRegistry, mocks, hustleModule, utils) {
    describe("register consumers", function() {
        var hustle, consumerRegistry, dataValueConsumer, consumer, q, scope;
        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($hustle, $q, $rootScope) {
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
            consumerRegistry = new ConsumerRegistry($hustle, $q, dataValueConsumer);
        }));

        it("should register and start consumers", function() {
            spyOn(hustle, "registerConsumer");
            consumerRegistry.register();
            expect(hustle.registerConsumer).toHaveBeenCalledWith(dataValueConsumer.run, "dataValues");
        });

        it("should deregister consumers", function() {
            spyOn(hustle, "registerConsumer").and.returnValue(utils.getPromise(q, consumer));
            consumerRegistry.register();
            scope.$apply();

            consumerRegistry.deregister();

            expect(consumer.stop).toHaveBeenCalled();
        });

        it("should start consumers if already registered", function() {
            spyOn(hustle, "registerConsumer").and.returnValue(utils.getPromise(q, consumer));
            consumerRegistry.register();
            scope.$apply();

            consumerRegistry.register();

            expect(consumer.start).toHaveBeenCalled();
        });

    });
});