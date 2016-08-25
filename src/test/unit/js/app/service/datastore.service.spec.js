define(['dataStoreService', 'angularMocks', 'dhisUrl'], function (DataStoreService, mocks, dhisUrl) {
    var dataStoreService, http, httpBackend, storeNamespace;
    describe('dataStoreService', function() {
        beforeEach(mocks.inject(function ($httpBackend, $http) {
            http = $http;
            httpBackend = $httpBackend;
            storeNamespace = "praxis";
            dataStoreService = new DataStoreService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it('should upload excluded options for specified module', function() {
            var moduleId = "someModuleId";
            var mockExcludedLinelistOptions = {};
            var storeKey = moduleId + "_excludedOptions";
            var url = [dhisUrl.dataStore, storeNamespace, storeKey].join("/");

            dataStoreService.updateExcludedOptions(moduleId, mockExcludedLinelistOptions);

            httpBackend.expectPOST(url, mockExcludedLinelistOptions).respond(200);
            httpBackend.flush();
        });

    });

});