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
                    var moduleIds = ['mod1', 'mod2'];

                    dataStoreService.getExcludedOptions(moduleIds).then(function (data) {
                        expect(data).toEqual(['excludedLineListOptionsMod1', 'excludedLineListOptionsMod2']);
                    });

                    httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "mod1_excludedOptions"].join("/")).respond(200, "excludedLineListOptionsMod1");
                    httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "mod2_excludedOptions"].join("/")).respond(200, "excludedLineListOptionsMod2");
                    httpBackend.flush();
                });

                it('should gracefully return undefined if there is no excluded options for specified module', function () {
                    spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: 'NOT_FOUND'}));
                    dataStoreService.getExcludedOptions([moduleId]).then(function (data) {
                        expect(data).toEqual([undefined]);
                    });
                });

                it('should reject promise if there is some server error', function () {
                    var mockErrorResponse = {};

                    var result = "someRandomValue";
                    dataStoreService.getExcludedOptions([moduleId]).then(function (data) {
                        result = data;
                    });

                    httpBackend.expectGET(url).respond(500, mockErrorResponse);
                    httpBackend.flush();
                    expect(result).toEqual("someRandomValue");
                });
            });
        });

        describe('referralLocations', function () {
            var opUnitId, storeKey, url, projectId;
            beforeEach(function () {
                projectId = "someProjectId";
                opUnitId = "someOpUnitId";
                storeKey = projectId + "_" + opUnitId + "_referralLocations";
                url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");
            });

            it('should create referralLocations for specified opUnit', function () {
                dataStoreService.createReferrals(projectId, opUnitId, {});

                httpBackend.expectPOST(url, {}).respond(201);
                httpBackend.flush();
            });

            it('should update referralLocations for specified opunit', function () {
                dataStoreService.updateReferrals(projectId, opUnitId, {});

                httpBackend.expectPUT(url, {}).respond(200);
                httpBackend.flush();
            });

            it('should get referral locations for specified multiple opUnits', function () {
                dataStoreService.getReferrals(projectId, opUnitId).then(function (data) {
                    expect(data).toEqual("mockReferralsForOpUnit1");
                });

                httpBackend.expectGET(url).respond(200, "mockReferralsForOpUnit1");
                httpBackend.flush();
            });

            it('should return undefined if key is not exist on dhis', function () {
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: "NOT_FOUND"}));
                dataStoreService.getReferrals(projectId, opUnitId).then(function (data) {
                    expect(data).toBeUndefined();
                });
            });

        });

        describe('patienOrigins', function () {
            var opUnitId, storeKey, url, projectId;
            beforeEach(function () {
                projectId = "projectId";
                opUnitId = "someOpUnitId";
                storeKey = projectId + "_" + opUnitId + "_patientOrigins";
                url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");
            });

            it('should create patient origins for specified opUnit', function () {
                dataStoreService.createPatientOrigins(projectId, opUnitId, {});

                httpBackend.expectPOST(url, {}).respond(201);
                httpBackend.flush();
            });

            it('should update patient origins for specified opunit', function () {
                dataStoreService.updatePatientOrigins(projectId, opUnitId, {});

                httpBackend.expectPUT(url, {}).respond(200);
                httpBackend.flush();
            });

            it('should get patient origins for specified opUnit', function () {
                dataStoreService.getPatientOrigins(projectId, opUnitId).then(function (data) {
                    expect(data).toEqual("mockOpUnitsForOpUnit1");
                });

                httpBackend.expectGET(url).respond(200, "mockOpUnitsForOpUnit1");
                httpBackend.flush();
            });

            it('should return undefined if key is not exist on dhis', function () {
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: "NOT_FOUND"}));
                dataStoreService.getPatientOrigins('projectId', 'opUnit1').then(function (data) {
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
                var keysFromRemote = ['prj1_key1_excludedOptions', 'prj1_key2_excludedOptions', 'key3_otherOption', 'prj1_key4_excludedOptions', 'prj1_key5_excludedOptions', 'prj1_key6_excludedOptions'];

                var actualKeys;
                dataStoreService.getKeysForExcludedOptions("prj1").then(function (data) {
                    actualKeys = data;
                });

                httpBackend.expectGET(url).respond(200, keysFromRemote);
                httpBackend.flush();
                expect(actualKeys).toEqual(['key1_excludedOptions', 'key2_excludedOptions', 'key4_excludedOptions', 'key5_excludedOptions', 'key6_excludedOptions']);
            });
        });

        describe('getUpdatedData', function () {
            var projectIds, keysFromRemote, url;
            beforeEach(function () {
                projectIds = ["prj1", "prj2"];
                keysFromRemote = ['prj1_key1_excludedOptions', 'prj3_key2_excludedOptions', 'prj2_key2_referralLocations'];
                url = [dhisUrl.dataStore, storeNamespace].join("/");
                httpBackend.whenGET(url + "?lastUpdated=lastUpdatedTime").respond(200, keysFromRemote);
                httpBackend.whenGET([dhisUrl.dataStore, storeNamespace, "prj1_key1_excludedOptions"].join("/")).respond(200, "mockExcludedOptions");
                httpBackend.whenGET([dhisUrl.dataStore, storeNamespace, "prj2_key2_referralLocations"].join("/")).respond(200, "mockReferralLocations");
            });
            it('should get the updated keys', function () {
                url = [dhisUrl.dataStore, storeNamespace].join("/");
                dataStoreService.getUpdatedData(projectIds, "lastUpdatedTime");
                httpBackend.expectGET(url + "?lastUpdated=lastUpdatedTime").respond(200, keysFromRemote);
                httpBackend.flush();
            });

            it('should return empty list if namespace is not exist', function () {
                var projectIds = ["prj1", "prj2"];
                spyOn(http, 'get').and.returnValue(utils.getRejectedPromise(q, {errorCode: "NOT_FOUND"}));
                dataStoreService.getUpdatedData(projectIds, "lastUpdatedTime").then(function (data) {
                    expect(data).toEqual({});
                }, fail);
            });

            it('should download data for updated keys', function () {
                dataStoreService.getUpdatedData(projectIds, "lastUpdatedTime");
                httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "prj1_key1_excludedOptions"].join("/")).respond(200);
                httpBackend.expectGET([dhisUrl.dataStore, storeNamespace, "prj2_key2_referralLocations"].join("/")).respond(200);
                httpBackend.flush();
            });

            it('should return updated data', function () {
                dataStoreService.getUpdatedData(projectIds, "lastUpdatedTime").then(function (data) {
                    expect(data).toEqual({
                        referralLocations: ["mockReferralLocations"],
                        excludedOptions: ["mockExcludedOptions"],
                        excludedDataElements: [],
                        patientOrigins: []
                    });
                });
                httpBackend.flush();
            });
        });
    });
});