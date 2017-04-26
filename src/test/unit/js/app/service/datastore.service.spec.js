define(['dataStoreService', 'angularMocks', 'dhisUrl', 'utils'], function (DataStoreService, mocks, dhisUrl, utils) {
    var dataStoreService, http, httpBackend, storeNamespace, q;
    describe('dataStoreService', function() {
        beforeEach(mocks.inject(function ($httpBackend, $http, $q) {
            http = $http;
            q = $q;
            httpBackend = $httpBackend;
            storeNamespace = "praxis";
            dataStoreService = new DataStoreService(http, q);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        describe('excludedOptions', function() {
            var moduleId, storeKey, url;
            beforeEach(function () {
                moduleId = "someModuleId";
                storeKey = moduleId + "_excludedOptions";
                url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");
            });

            it('should update excluded options for specified module', function() {
                var mockExcludedLinelistOptions = {};

                dataStoreService.updateExcludedOptions(moduleId, mockExcludedLinelistOptions);

                httpBackend.expectPUT(url, mockExcludedLinelistOptions).respond(200);
                httpBackend.flush();
            });

            it('should create excluded options for specified module', function() {
                var mockExcludedLinelistOptions = {};

                dataStoreService.createExcludedOptions(moduleId, mockExcludedLinelistOptions);

                httpBackend.expectPOST(url, mockExcludedLinelistOptions).respond(200);
                httpBackend.flush();
            });

            describe('getExcludedOptions', function () {

                it('should download excluded options for specified module', function () {
                    var mockExcludedLinelistOptions = {};

                    dataStoreService.getExcludedOptions(moduleId);

                    httpBackend.expectGET(url).respond(200, mockExcludedLinelistOptions);
                    httpBackend.flush();
                });

                it('should gracefully return undefined if there is no excluded options for specified module', function () {
                    spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: 'NOT_FOUND'}));
                    dataStoreService.getExcludedOptions(moduleId).then(function (data) {
                        expect(data).toBeUndefined();
                    });
                });

                it('should reject promise if there is some server error', function () {
                    var mockErrorResponse = {};

                    var result = "someRandomValue";
                    dataStoreService.getExcludedOptions(moduleId).then(function (data) {
                        result = data;
                    });

                    httpBackend.expectGET(url).respond(500, mockErrorResponse);
                    httpBackend.flush();
                    expect(result).toEqual("someRandomValue");

                });
            });
        });

        describe('referralLocations', function () {
            var moduleId, storeKey, url;
            beforeEach(function () {
                moduleId = "someModuleId";
                storeKey = moduleId + "_referralLocations";
                url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");
            });

            it('should create referralLocations for specified module', function () {
                dataStoreService.createReferrals(moduleId, {});

                httpBackend.expectPOST(url, {}).respond(201);
                httpBackend.flush();
            });

            it('should update referralLocations for specified module', function () {
                dataStoreService.updateReferrals(moduleId, {});

                httpBackend.expectPUT(url, {}).respond(200);
                httpBackend.flush();
            });

        });

        describe('getKeysForExcludedOptions', function () {
            var moduleId, url;
            beforeEach(function () {
                moduleId = "someModuleId";
                url = [dhisUrl.dataStore, storeNamespace].join("/");
            });

            it('should get keys only for excludedOptions', function () {
                var keysFromRemote = ['key1_excludedOptions', 'key2_excludedOptions', 'key3_otherOption', 'key4_excludedOptions', 'key5_excludedOptions', 'key6_excludedOptions'];

                var actualKeys;
                dataStoreService.getKeysForExcludedOptions().then(function (data) {
                    actualKeys = data;
                });

                httpBackend.expectGET(url).respond(200, keysFromRemote);
                httpBackend.flush();
                expect(actualKeys).toEqual(['key1_excludedOptions', 'key2_excludedOptions', 'key4_excludedOptions', 'key5_excludedOptions', 'key6_excludedOptions']);
            });

            it('should return empty list if namespace is not exist', function () {
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: 'NOT_FOUND'}));
                dataStoreService.getKeysForExcludedOptions().then(function (data) {
                    expect(data).toEqual([]);
                });
                expect(http.get).toHaveBeenCalled();
            });
        });
    });
});