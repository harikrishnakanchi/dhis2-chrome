define(["queuePostProcessInterceptor", "angularMocks", "hustle", "properties", "utils", "chromeRuntime"], function(QueuePostProcessInterceptor, mocks, hustle, properties, utils, chromeRuntime) {
    describe('queuePostProcessInterceptor', function() {

        var hustle, queuePostProcessInterceptor, q, rootScope;
        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            hustle = new Hustle();
            queuePostProcessInterceptor = new QueuePostProcessInterceptor($log);
            q = $q;
            rootScope = $rootScope;
            spyOn(chromeRuntime, "sendMessage");
        }));

        it('should release message if number of releases is less than max retries', function() {
            spyOn(hustle.Queue, "release");
            spyOn(hustle.Queue, "bury");

            queuePostProcessInterceptor.onFailure({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries - 1
            }, {}, hustle.Queue);

            expect(hustle.Queue.release).toHaveBeenCalledWith(1);
            expect(hustle.Queue.bury).not.toHaveBeenCalled();
        });

        it('should bury message if number of releases is more than max retries', function() {
            spyOn(hustle.Queue, "release");
            spyOn(hustle.Queue, "bury");

            queuePostProcessInterceptor.onFailure({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries + 1
            }, {}, hustle.Queue);

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

            var data =  {
                    "type": "a",
                    "requestId": "1"
                };

            queuePostProcessInterceptor.onFailure({
                "id": existingMessageId,
                "releases": properties.queue.maxretries + 1,
                "data": data,
                "tube": tubeName

            }, httpTimeOutReponse, hustle.Queue);
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