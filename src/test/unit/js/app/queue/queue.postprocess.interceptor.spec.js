define(["queuePostProcessInterceptor", "angularMocks", "properties", "chromeUtils", "utils", "dataRepository", "approvalDataRepository"], function(QueuePostProcessInterceptor, mocks, properties, chromeUtils, utils, DataRepository, ApprovalDataRepository) {
    describe('queuePostProcessInterceptor', function() {

        var hustle, queuePostProcessInterceptor, q, rootScope, ngI18nResourceBundle, scope, dataRepository, approvalDataRepository;

        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            q = $q;
            rootScope = $rootScope;
            scope = $rootScope.$new();

            dataRepository = new DataRepository();
            approvalDataRepository = new ApprovalDataRepository();

            spyOn(chromeUtils, "sendMessage");
            spyOn(chromeUtils, "createNotification");

            ngI18nResourceBundle = {
                "get": jasmine.createSpy("ngI18nResourceBundle").and.returnValue(utils.getPromise(q, {
                    "data": {}
                }))
            };

            queuePostProcessInterceptor = new QueuePostProcessInterceptor($log, ngI18nResourceBundle, dataRepository, approvalDataRepository);
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

            properties.queue.skipRetryMessages = ['downloadMetadata'];

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

        it('should notify user after 3 retries', function() {
            var actualResult = queuePostProcessInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": 2
            }, {});

            scope.$apply();

            expect(chromeUtils.createNotification).toHaveBeenCalled();
        });

        it('should notify user after max retries has exceeded', function() {
            queuePostProcessInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries
            }, {});

            scope.$apply();

            expect(chromeUtils.createNotification).toHaveBeenCalled();
        });

        it("should notify user if product key has expired", function() {
            var job = {
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": 0
            };

            var data = {
                "status": 401
            };

            queuePostProcessInterceptor.shouldRetry(job, data);

            scope.$apply();

            expect(chromeUtils.createNotification).toHaveBeenCalled();
            expect(chromeUtils.sendMessage.calls.count()).toEqual(3);
            expect(chromeUtils.sendMessage.calls.argsFor(1)).toEqual(["dhisOffline"]);
            expect(chromeUtils.sendMessage.calls.argsFor(2)).toEqual(["productKeyExpired"]);
        });

        it("should change dataValues status for specific period and orgUnit to 'FAILED_TO_SYNC' after maxretries", function() {
            var periodAndOrgUnit = {
                "period": "2016W01",
                "orgUnit": "abcd"
            };
            var job = {
                "id": 1,
                "data": {
                    "type": "uploadDataValues",
                    "data": periodAndOrgUnit
                },
                "releases": 6
            };

            spyOn(dataRepository, "setLocalStatus");
            queuePostProcessInterceptor.shouldRetry(job, {});

            scope.$apply();

            expect(dataRepository.setLocalStatus).toHaveBeenCalledWith(periodAndOrgUnit, "FAILED_TO_SYNC");
        });

        it("should not call dataRepository for other jobs except 'uploadDataValues'", function() {
            var periodsAndOrgUnits = [{
                "period": "2016W01",
                "orgUnit": "abcd"
            }];
            var job = {
                "id": 1,
                "data": {
                    "type": "NOTUploadDataValues",
                    "data": periodsAndOrgUnits
                },
                "releases": 6
            };

            spyOn(dataRepository, "setLocalStatus");
            queuePostProcessInterceptor.shouldRetry(job, {});

            scope.$apply();

            expect(dataRepository.setLocalStatus).not.toHaveBeenCalled();
        });

        it("should change completion data status to 'FAILED_TO_SYNC' after maxretries", function() {
            var job = {
                "id": 1,
                "data": {
                    "type": "uploadCompletionData",
                    "data": "someData"
                },
                "releases": 6
            };

            spyOn(approvalDataRepository, "setLocalStatus");
            queuePostProcessInterceptor.shouldRetry(job, {});

            scope.$apply();

            expect(approvalDataRepository.setLocalStatus).toHaveBeenCalledWith("someData", "FAILED_TO_SYNC");
        });

        it("should change approval data status for to 'FAILED_TO_SYNC' after maxretries", function() {
            var job = {
                "id": 1,
                "data": {
                    "type": "uploadApprovalData",
                    "data": "someData"
                },
                "releases": 6
            };

            spyOn(approvalDataRepository, "setLocalStatus");
            queuePostProcessInterceptor.shouldRetry(job, {});

            scope.$apply();

            expect(approvalDataRepository.setLocalStatus).toHaveBeenCalledWith("someData", "FAILED_TO_SYNC");
        });
    });
});
