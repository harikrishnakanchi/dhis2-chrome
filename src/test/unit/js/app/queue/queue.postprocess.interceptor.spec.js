define(["queuePostProcessInterceptor", "angularMocks", "properties", "chromeUtils"], function(QueuePostProcessInterceptor, mocks, properties, chromeUtils) {
    describe('queuePostProcessInterceptor', function() {

        var hustle, queuePostProcessInterceptor, q, rootScope;
        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            queuePostProcessInterceptor = new QueuePostProcessInterceptor($log);
            q = $q;
            rootScope = $rootScope;
            spyOn(chromeUtils, "sendMessage");
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

            expect(chromeUtils.sendMessage).toHaveBeenCalledWith({
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

            expect(chromeUtils.sendMessage).toHaveBeenCalledWith({
                "message": "aDone",
                "requestId": "1"
            });
        });

        it('should return false for retry if job type is blacklisted for retrial', function() {
            var actualResult = queuePostProcessInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "downloadMetadata",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries - 2
            }, {});

            expect(actualResult).toBeFalsy();
        });
    });
});
