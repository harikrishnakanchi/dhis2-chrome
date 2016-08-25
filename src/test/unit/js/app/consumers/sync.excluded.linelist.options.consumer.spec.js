define(['syncExcludedLinelistOptionsConsumer', 'angularMocks', 'utils', 'excludedLineListOptionsRepository'], function (SyncExcludedLinelistOptionsConsumer, mocks, utils, ExcludedLineListOptionsRepository) {
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
            spyOn(excludedLineListOptionsRepository, "get").and.returnValue(utils.getPromise(q, undefined));
            dataStoreService = {
                updateExcludedOptions: jasmine.createSpy("getExcludedOptions").and.returnValue(utils.getPromise(q, undefined))
            };
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

        it('should upload current excluded linelistOptions to DHIS', function() {
            var excludedLineListOptions = mockExcludedLineListOptions();
            excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, excludedLineListOptions));
            initializeConsumer(moduleId);

            expect(dataStoreService.updateExcludedOptions).toHaveBeenCalledWith(moduleId, excludedLineListOptions);
        });
    });
});