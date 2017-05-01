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
            var opUnitId, storeKey, url;
            beforeEach(function () {
                opUnitId = "someOpUnitId";
                storeKey = opUnitId + "_referralLocations";
                url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");
            });

            it('should create referralLocations for specified opUnit', function () {
                dataStoreService.createReferrals(opUnitId, {});

                httpBackend.expectPOST(url, {}).respond(201);
                httpBackend.flush();
            });

            it('should update referralLocations for specified opunit', function () {
                dataStoreService.updateReferrals(opUnitId, {});

                httpBackend.expectPUT(url, {}).respond(200);
                httpBackend.flush();
            });

            it('should get referral locations for specified multiple opUnits', function () {
                var opUnitIds = ["opUnit1", "opUnit2"];
                dataStoreService.getReferrals(opUnitIds).then(function (data) {
                    expect(data).toEqual(["mockReferralsForOpUnit1", "mockReferralsForOpUnit2"]);
                });

                httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "opUnit1_referralLocations"].join("/")).respond(200, "mockReferralsForOpUnit1");
                httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "opUnit2_referralLocations"].join("/")).respond(200, "mockReferralsForOpUnit2");
                httpBackend.flush();
            });

            it('should return undefined if key is not exist on dhis', function () {
                var opUnitIds = ["opUnit1", "opUnit2"];
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: "NOT_FOUND"}));
                dataStoreService.getReferrals(opUnitIds).then(function (data) {
                    expect(data).toEqual([undefined, undefined]);
                });
            });

        });

        describe('patienOrigins', function () {
            var opUnitId, storeKey, url;
            beforeEach(function () {
                opUnitId = "someOpUnitId";
                storeKey = opUnitId + "_patientOrigins";
                url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");
            });

            it('should create patient origins for specified opUnit', function () {
                dataStoreService.createPatientOrigins(opUnitId, {});

                httpBackend.expectPOST(url, {}).respond(201);
                httpBackend.flush();
            });

            it('should update referralLocations for specified opunit', function () {
                dataStoreService.updatePatientOrigins(opUnitId, {});

                httpBackend.expectPUT(url, {}).respond(200);
                httpBackend.flush();
            });

            it('should get referral locations for specified opUnit', function () {
                dataStoreService.getPatientOrigins(opUnitId).then(function (data) {
                    expect(data).toEqual("mockPatientOrigins");
                });

                httpBackend.expectGET(url).respond(200, "mockPatientOrigins");
                httpBackend.flush();
            });

            it('should return undefined if key is not exist on dhis', function () {
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: "NOT_FOUND"}));
                dataStoreService.getPatientOrigins(opUnitId).then(function (data) {
                    expect(data).toBeUndefined();
                });
            });

        });

        describe('excludedDataElements', function () {
            var moduleId, storeKey, url;
            beforeEach(function () {
                moduleId = "someModuleId";
                storeKey = moduleId + "_excludedDataElements";
                url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");
            });

            it('should create excluded dataelements for specified module', function () {
                dataStoreService.createExcludedDataElements(moduleId, {});

                httpBackend.expectPOST(url, {}).respond(201);
                httpBackend.flush();
            });

            it('should update excluded data elements for specified module', function () {
                dataStoreService.updateExcludedDataElements(moduleId, {});

                httpBackend.expectPUT(url, {}).respond(200);
                httpBackend.flush();
            });

            it('should get excluded dataElements for specified module', function () {
                var moduleIds = ["mod1", "mod2"];
                dataStoreService.getExcludedDataElements(moduleIds).then(function (data) {
                    expect(data).toEqual(["mockPatientOriginsMod1", "mockPatientOriginsMod2"]);
                });

                httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "mod1_excludedDataElements"].join("/")).respond(200, "mockPatientOriginsMod1");
                httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "mod2_excludedDataElements"].join("/")).respond(200, "mockPatientOriginsMod2");
                httpBackend.flush();
            });

            it('should return undefined if key is not exist on dhis', function () {
                var moduleIds = ["mod1", "mod2"];
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: "NOT_FOUND"}));
                dataStoreService.getExcludedDataElements(moduleIds).then(function (data) {
                    expect(data).toEqual([undefined, undefined]);
                });
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
        });

        describe('getUpdatedKeys', function () {

            it('should get the updated keys', function () {
                var url = [dhisUrl.dataStore, storeNamespace].join("/");
                var keysFromRemote = ['key1_excludedOptions', 'key2_excludedOptions', 'key1_referralLocations', 'anotherKey'];
                var actualKeys;
                dataStoreService.getUpdatedKeys("lastUpdatedTime").then(function (data) {
                    actualKeys = data;
                });
                httpBackend.expectGET(url + "?lastUpdated=lastUpdatedTime").respond(200, keysFromRemote);
                httpBackend.flush();
                expect(actualKeys).toEqual({
                    excludedOptions: ['key1', 'key2'],
                    referralLocations: ['key1'],
                    anotherKey: ['anotherKey']
                });
            });

            it('should return empty list if namespace is not exist', function () {
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: "NOT_FOUND"}));
                dataStoreService.getUpdatedKeys().then(function (data) {
                    expect(data).toEqual({});
                });
            });
        });
    });
});