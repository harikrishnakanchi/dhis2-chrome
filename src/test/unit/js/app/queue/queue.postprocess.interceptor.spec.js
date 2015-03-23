define(["queuePostProcessInterceptor", "angularMocks", "properties", "chromeRuntime"], function(QueuePostProcessInterceptor, mocks, properties, chromeRuntime) {
    describe('queuePostProcessInterceptor', function() {

        var hustle, queuePostProcessInterceptor, q, rootScope;
        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            queuePostProcessInterceptor = new QueuePostProcessInterceptor($log);
            q = $q;
            rootScope = $rootScope;
            spyOn(chromeRuntime, "sendMessage");
        }));

        it('should return true for retry if number of releases is less than max retries', function() {
            var actualResult = queuePostProcessInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries - 1
            }, {});
            expect(actualResult).toBeTruthy();
        });

        it('should return false for retry if number of releases is more than max retries', function() {
            var actualResult = queuePostProcessInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries + 1
            }, {});

            expect(actualResult).toBeFalsy();
        });

        it("should send message on failure", function() {
            queuePostProcessInterceptor.onFailure({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": 1
            }, {});

            expect(chromeRuntime.sendMessage).toHaveBeenCalledWith({
                "message": "aFailed",
                "requestId": "1"
            });
        });

        it("should send message on success", function() {
            queuePostProcessInterceptor.onSuccess({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": 1
            }, {});

            expect(chromeRuntime.sendMessage).toHaveBeenCalledWith({
                "message": "aDone",
                "requestId": "1"
            });
        });
    });
});
