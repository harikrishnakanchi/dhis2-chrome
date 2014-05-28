define(["failureStrategyFactory", "angularMocks", "hustle", "properties"], function(failureStrategyFactory, mocks, hustle, properties) {
    describe('retry strategy factory', function() {

        var hustle, retryStrategy;
        beforeEach(function() {
            hustle = new Hustle();
            retryStrategy = failureStrategyFactory.create(hustle);
        });

        it('should release message if number of releases is less than max retries', function() {
            spyOn(hustle.Queue, "release");
            spyOn(hustle.Queue, "bury");

            retryStrategy({
                "id": 1,
                "releases": properties.queue.maxretries - 1
            });

            expect(hustle.Queue.release).toHaveBeenCalledWith(1);
            expect(hustle.Queue.bury).not.toHaveBeenCalled();
        });

        it('should bury message if number of releases is more than max retries', function() {
            spyOn(hustle.Queue, "release");
            spyOn(hustle.Queue, "bury");

            retryStrategy({
                "id": 1,
                "releases": properties.queue.maxretries + 1
            });

            expect(hustle.Queue.release).not.toHaveBeenCalled();
            expect(hustle.Queue.bury).toHaveBeenCalledWith(1);
        });
    });
});