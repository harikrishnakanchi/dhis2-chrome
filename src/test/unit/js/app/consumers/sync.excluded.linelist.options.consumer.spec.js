define(['syncExcludedLinelistOptionsConsumer', 'angularMocks', 'utils', 'excludedLineListOptionsRepository'], function (SyncExcludedLinelistOptionsConsumer, mocks, utils, ExcludedLineListOptionsRepository) {
    var syncExcludedLinelistOptionsConsumer, q, scope, message, moduleId, excludedLineListOptionsRepository;

    describe('syncExcludedLinelistOptionsConsumer', function () {
        beforeEach(mocks.inject(function ($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();
            message = {
                data: {data: undefined}
            };
            excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository();
            spyOn(excludedLineListOptionsRepository, "get").and.returnValue(utils.getPromise(q, undefined));
            syncExcludedLinelistOptionsConsumer = new SyncExcludedLinelistOptionsConsumer(q, excludedLineListOptionsRepository);
        }));

        it('should get excluded options for specified module', function () {
            moduleId = "someModuleId";
            message.data.data = moduleId;
            syncExcludedLinelistOptionsConsumer.run(message);
            scope.$apply();

            expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith(moduleId);
        });

        it('should gracefully return if there is no moduleId specified', function () {
            moduleId = "someModuleId";
            message.data.data = undefined;
            syncExcludedLinelistOptionsConsumer.run(message);
            scope.$apply();

            expect(excludedLineListOptionsRepository.get).not.toHaveBeenCalled();
        });
    });
});