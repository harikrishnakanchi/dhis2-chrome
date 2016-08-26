define(['dataStoreService', 'angularMocks', 'dhisUrl'], function (DataStoreService, mocks, dhisUrl) {
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

            it('should upload excluded options for specified module', function() {
                var mockExcludedLinelistOptions = {};

                dataStoreService.updateExcludedOptions(moduleId, mockExcludedLinelistOptions);

                httpBackend.expectPOST(url, mockExcludedLinelistOptions).respond(200);
                httpBackend.flush();
            });

            it('should download excluded options for specified module', function() {
                var mockExcludedLinelistOptions = {};

                dataStoreService.getExcludedOptions(moduleId);

                httpBackend.expectGET(url).respond(200, mockExcludedLinelistOptions);
                httpBackend.flush();
            });

            it('should gracefully return undefined if there is no excluded options for specified module', function() {
                var mockErrorResponse = {};

                var result = "someRandomValue";
                dataStoreService.getExcludedOptions(moduleId).then(function (data) {
                    result = data;
                });

                httpBackend.expectGET(url).respond(404, mockErrorResponse);
                httpBackend.flush();
                expect(result).toBeUndefined();
            });

            it('should reject promise if there is some server error', function() {
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

});