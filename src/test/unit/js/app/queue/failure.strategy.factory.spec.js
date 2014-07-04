define(["failureStrategyFactory", "angularMocks", "hustle", "properties", "utils"], function(failureStrategyFactory, mocks, hustle, properties, utils) {
    describe('retry strategy factory', function() {

        var hustle, retryStrategy, q, rootScope;
        beforeEach(mocks.inject(function($q, $rootScope) {
            hustle = new Hustle();
            retryStrategy = failureStrategyFactory.create(hustle);
            q = $q;
            rootScope = $rootScope;
        }));

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

        it('should put new message with highest priority in case of http timeout', function() {
            var tubeName = "dataValues";
            var existingMessageId = 1;
            var httpTimeOutReponse = {
                "status": 0
            };
            spyOn(hustle.Queue, "put").and.returnValue(utils.getPromise(q, {}));
            spyOn(hustle.Queue, "delete");
            spyOn(hustle.Queue, "release");
            spyOn(hustle.Queue, "bury");
            var data = {
                "type": "uploadDataValues",
                "data": {}
            };

            retryStrategy({
                "id": existingMessageId,
                "releases": properties.queue.maxretries + 1,
                "data": data,
                "tube": tubeName

            }, httpTimeOutReponse);
            rootScope.$apply();

            expect(hustle.Queue.put).toHaveBeenCalledWith(data, {
                "tube": tubeName,
                "priority": 1
            });
            expect(hustle.Queue.delete).toHaveBeenCalledWith(existingMessageId);
            expect(hustle.Queue.release).not.toHaveBeenCalled();
            expect(hustle.Queue.bury).not.toHaveBeenCalled();
        });
    });
});