define(["registerConsumers", "angularMocks", "hustleModule"], function(RegisterConsumers, mocks, hustleModule) {
    var hustle, registerConsumers, dataValueConsumer;
    beforeEach(module('hustle'));
    beforeEach(mocks.inject(function($hustle) {
        hustle = $hustle;
        dataValueConsumer = {
            "run": function() {}
        };
        registerConsumers = new RegisterConsumers($hustle, dataValueConsumer);
    }));

    describe("register consumers", function() {
        it("should register consumers", function() {
            spyOn(hustle, "registerConsumer");
            registerConsumers.run();
            expect(hustle.registerConsumer).toHaveBeenCalledWith(dataValueConsumer.run, "dataValues");
        });

    });
});