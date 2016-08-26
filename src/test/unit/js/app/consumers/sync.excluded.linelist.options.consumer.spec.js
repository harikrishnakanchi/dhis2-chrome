define(['syncExcludedLinelistOptionsConsumer', 'angularMocks', 'utils', 'excludedLineListOptionsRepository', 'dataStoreService'], function (SyncExcludedLinelistOptionsConsumer, mocks, utils, ExcludedLineListOptionsRepository, DataStoreService) {
    var syncExcludedLinelistOptionsConsumer, q, scope, message, moduleId, excludedLineListOptionsRepository, dataStoreService;

    describe('syncExcludedLinelistOptionsConsumer', function () {
        beforeEach(mocks.inject(function ($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();
            message = {
                data: {data: undefined}
            };
            moduleId = "someModuleId";
            excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository();
            spyOn(excludedLineListOptionsRepository, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(excludedLineListOptionsRepository, "upsert").and.returnValue(utils.getPromise(q, undefined));
            dataStoreService = new DataStoreService();
            spyOn(dataStoreService, 'updateExcludedOptions').and.returnValue(utils.getPromise(q, undefined));
            spyOn(dataStoreService, 'getLastUpdatedTimeForExcludedOptions').and.returnValue(utils.getPromise(q, undefined));
            spyOn(dataStoreService, 'getExcludedOptions').and.returnValue(utils.getPromise(q, undefined));
            dataStoreService.createExcludedOptions = jasmine.createSpy("createExcludedOptions").and.returnValue(utils.getPromise(q, undefined));
            syncExcludedLinelistOptionsConsumer = new SyncExcludedLinelistOptionsConsumer(q, excludedLineListOptionsRepository, dataStoreService);
        }));

        var initializeConsumer = function (moduleId) {
            message.data.data = moduleId;
            syncExcludedLinelistOptionsConsumer.run(message);
            scope.$apply();
        };

        var mockExcludedLineListOptions = function (options) {
            return _.assign({
                moduleId: moduleId,
                clientLastUpdated: "someTime",
                dataElements: []
            }, options);
        };

        it('should get excluded options for specified module', function () {
            initializeConsumer(moduleId);

            expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith(moduleId);
        });

        it('should gracefully return if there is no moduleId specified', function () {
            moduleId = undefined;
            initializeConsumer(moduleId);

            expect(excludedLineListOptionsRepository.get).not.toHaveBeenCalled();
        });

        it('should update excludedLinelist options on remote if remoteData is older than local data', function () {
            var excludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
            dataStoreService.getLastUpdatedTimeForExcludedOptions.and.returnValue(utils.getPromise(q, "2016-05-18T00:00:00.000Z"));
            excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, excludedLineListOptions));

            initializeConsumer(moduleId);

            expect(dataStoreService.updateExcludedOptions).toHaveBeenCalledWith(moduleId, excludedLineListOptions);
        });

        it('should get lastUpdated time on DHIS', function() {
            initializeConsumer(moduleId);

            expect(dataStoreService.getLastUpdatedTimeForExcludedOptions).toHaveBeenCalledWith(moduleId);
        });

        it('should update excludedLinelist options on local if localData is older than remote data', function() {
            var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
            var remoteExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-20T00:00:00.000Z"});
            dataStoreService.getLastUpdatedTimeForExcludedOptions.and.returnValue(utils.getPromise(q, "2016-05-20T00:00:00.000Z"));
            dataStoreService.getExcludedOptions.and.returnValue(utils.getPromise(q, remoteExcludedLineListOptions));
            excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));

            initializeConsumer(moduleId);

            expect(dataStoreService.updateExcludedOptions).not.toHaveBeenCalledWith(moduleId, localExcludedLineListOptions);
            expect(dataStoreService.getExcludedOptions).toHaveBeenCalledWith(moduleId);
            expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(remoteExcludedLineListOptions);
        });

        it('should create excludedOptions on DHIS if there is no remote data', function () {
            var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
            dataStoreService.getLastUpdatedTimeForExcludedOptions.and.returnValue(utils.getPromise(q, undefined));
            excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));

            initializeConsumer(moduleId);

            expect(dataStoreService.createExcludedOptions).toHaveBeenCalledWith(moduleId, localExcludedLineListOptions);
        });
    });
});