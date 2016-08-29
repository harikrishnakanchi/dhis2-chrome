define(['syncExcludedLinelistOptionsConsumer', 'angularMocks', 'utils', 'excludedLinelistOptionsMerger'], function (SyncExcludedLinelistOptionsConsumer, mocks, utils, ExcludedLinelistOptionsMerger) {
    var syncExcludedLinelistOptionsConsumer, q, scope, message, moduleId, excludedLinelistOptionsMerger;

    describe('syncExcludedLinelistOptionsConsumer', function () {
        beforeEach(mocks.inject(function ($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();
            message = {
                data: {data: undefined}
            };
            moduleId = "someModuleId";

            excludedLinelistOptionsMerger = new ExcludedLinelistOptionsMerger();
            spyOn(excludedLinelistOptionsMerger, 'mergeAndSync').and.returnValue(utils.getPromise(q, undefined));
            syncExcludedLinelistOptionsConsumer = new SyncExcludedLinelistOptionsConsumer(q, excludedLinelistOptionsMerger);
        }));

        var initializeConsumer = function (moduleId) {
            message.data.data = moduleId;
            syncExcludedLinelistOptionsConsumer.run(message);
            scope.$apply();
        };

        it('should merge excludedOptions for linelist', function () {
            initializeConsumer(moduleId);

            expect(excludedLinelistOptionsMerger.mergeAndSync).toHaveBeenCalledWith(moduleId);
        });
    });
});