define(["queueInterceptor", "angularMocks", "properties", "platformUtils", "utils", "dataRepository", "approvalDataRepository", "orgUnitRepository", "dataSyncFailureRepository"],
    function(QueueInterceptor, mocks, properties, platformUtils, utils, DataRepository, ApprovalDataRepository, OrgUnitRepository, DataSyncFailureRepository) {
    describe('queueInterceptor', function() {

        var queueInterceptor, q, rootScope, ngI18nResourceBundle, scope, dataRepository, approvalDataRepository, orgUnitRepository, dataSyncFailureRepository;

        beforeEach(mocks.inject(function($q, $rootScope, $log) {
            q = $q;
            rootScope = $rootScope;
            scope = $rootScope.$new();

            dataRepository = new DataRepository();
            spyOn(dataRepository, "setLocalStatus").and.returnValue(utils.getPromise(q, {}));
            spyOn(dataRepository, "flagAsFailedToSync").and.returnValue(utils.getPromise(q, {}));

            approvalDataRepository = new ApprovalDataRepository();
            spyOn(approvalDataRepository, "flagAsFailedToSync").and.returnValue(utils.getPromise(q, {}));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, "findAllByParent").and.returnValue(utils.getPromise(q, []));

            spyOn(platformUtils, "sendMessage");
            spyOn(platformUtils, "createNotification");

            dataSyncFailureRepository = new DataSyncFailureRepository();
            spyOn(dataSyncFailureRepository, "add").and.returnValue(utils.getPromise(q, undefined));
            ngI18nResourceBundle = {
                get: jasmine.createSpy('ngI18nResourceBundle').and.returnValue(utils.getPromise(q, {
                    data: {
                        notificationRetryMessage: 'some message',
                        notificationAbortRetryMessage: 'another message'
                    }
                }))
            };

            queueInterceptor = new QueueInterceptor($log, ngI18nResourceBundle, dataRepository, dataSyncFailureRepository);
        }));

        it('should return true for retry if number of releases is less than max retries', function() {
            var actualResult = queueInterceptor.shouldRetry({
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
            var actualResult = queueInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries + 1
            }, {});

            expect(actualResult).toBeFalsy();
        });

        it('should return false for retry if job type is blacklisted for retrial', function() {

            properties.queue.skipRetryMessages = ['downloadMetadata'];

            var actualResult = queueInterceptor.shouldRetry({
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
            var actualResult = queueInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": 2
            }, {});

            scope.$apply();

            expect(platformUtils.createNotification).toHaveBeenCalled();
        });

        it('should notify user after max retries has exceeded', function() {
            queueInterceptor.shouldRetry({
                "id": 1,
                "data": {
                    "type": "a",
                    "requestId": "1"
                },
                "releases": properties.queue.maxretries
            }, {});

            scope.$apply();

            expect(platformUtils.createNotification).toHaveBeenCalled();
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

            queueInterceptor.shouldRetry(job, data);

            scope.$apply();

            expect(platformUtils.createNotification).toHaveBeenCalled();
            expect(platformUtils.sendMessage.calls.count()).toEqual(2);
            expect(platformUtils.sendMessage.calls.argsFor(0)).toEqual(["dhisOffline"]);
            expect(platformUtils.sendMessage.calls.argsFor(1)).toEqual(["productKeyExpired"]);
        });

        it("should mark the failed to sync module by period after maxretries", function() {
            var job = {
                data: {
                    type: "syncModuleDataBlock",
                    data: {
                        moduleId: 'someModuleId',
                        period: 'somePeriod'
                    }
                },
                releases: properties.queue.maxretries + 1
            }, originOrgUnits = [{
                id: 'someOriginId'
            }];

            orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, originOrgUnits));

            queueInterceptor.shouldRetry(job, {});
            scope.$apply();

            expect(dataSyncFailureRepository.add).toHaveBeenCalledWith('someModuleId','somePeriod');
        });
    });
});
