define(['excludedLinelistOptionsMerger', 'angularMocks', 'utils', 'excludedLineListOptionsRepository', 'dataStoreService', 'orgUnitRepository'], function (ExcludedLinelistOptionsMerger, mocks, utils, ExcludedLineListOptionsRepository, DataStoreService, OrgUnitRepository) {
    var excludedLinelistOptionsMerger, q, scope, message, moduleId, excludedLineListOptionsRepository, dataStoreService, orgUnitRepository, projectId;

    describe('ExcludedLineListOptionsMerger', function() {
        beforeEach(mocks.inject(function ($rootScope, $q) {
            q = $q;
            scope = $rootScope.$new();
            message = {
                data: {data: undefined}
            };
            moduleId = "someModuleId";
            projectId = "projectId";

            excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository();
            spyOn(excludedLineListOptionsRepository, "get").and.returnValue(utils.getPromise(q, {}));
            spyOn(excludedLineListOptionsRepository, "upsert").and.returnValue(utils.getPromise(q, undefined));

            dataStoreService = new DataStoreService({});
            spyOn(dataStoreService, 'updateExcludedOptions').and.returnValue(utils.getPromise(q, undefined));
            spyOn(dataStoreService, 'getExcludedOptions').and.returnValue(utils.getPromise(q, undefined));
            spyOn(dataStoreService, 'createExcludedOptions').and.returnValue(utils.getPromise(q, undefined));

            orgUnitRepository = new OrgUnitRepository();
            spyOn(orgUnitRepository, 'getAllModulesInOrgUnits').and.returnValue(utils.getPromise(q, {}));
            spyOn(orgUnitRepository, 'getParentProject').and.returnValue(utils.getPromise(q, {id: projectId}));

            excludedLinelistOptionsMerger = new ExcludedLinelistOptionsMerger(q, excludedLineListOptionsRepository, dataStoreService, orgUnitRepository);
        }));

        var mockExcludedLineListOptions = function (options) {
            return _.assign({
                moduleId: moduleId,
                clientLastUpdated: "someTime",
                dataElements: []
            }, options);
        };

        describe('mergeAndSync', function() {
            var initializeMerger = function (moduleId) {
                excludedLinelistOptionsMerger.mergeAndSync(moduleId);
                scope.$apply();
            };

            it('should get excluded options for specified module', function () {
                initializeMerger(moduleId);

                expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith(moduleId);
            });

            it('should get projectId for specified module', function () {
                initializeMerger(moduleId);

                expect(orgUnitRepository.getParentProject).toHaveBeenCalledWith(moduleId);
            });

            it('should gracefully return if there is no moduleId specified', function () {
                moduleId = undefined;
                initializeMerger(moduleId);

                expect(excludedLineListOptionsRepository.get).not.toHaveBeenCalled();
            });

            it('should update excludedLinelist options on remote if remoteData is older than local data', function () {
                var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
                var remoteExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-18T00:00:00.000Z"});
                dataStoreService.getExcludedOptions.and.returnValue(utils.getPromise(q, remoteExcludedLineListOptions));
                excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));

                initializeMerger(moduleId);

                expect(dataStoreService.updateExcludedOptions).toHaveBeenCalledWith(projectId, moduleId, localExcludedLineListOptions);
            });

            it('should get remote excluded linelist options for speific module', function() {
                initializeMerger(moduleId);

                expect(dataStoreService.getExcludedOptions).toHaveBeenCalledWith(projectId, moduleId);
            });

            it('should update excludedLinelist options on local if localData is older than remote data', function() {
                var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
                var remoteExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-20T00:00:00.000Z"});
                dataStoreService.getExcludedOptions.and.returnValue(utils.getPromise(q, remoteExcludedLineListOptions));
                excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));

                initializeMerger(moduleId);

                expect(dataStoreService.updateExcludedOptions).not.toHaveBeenCalledWith(projectId, moduleId, localExcludedLineListOptions);
                expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(remoteExcludedLineListOptions);
            });

            it('should create excludedOptions on DHIS if there is no remote data', function () {
                var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
                dataStoreService.getExcludedOptions.and.returnValue(utils.getPromise(q, undefined));
                excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));

                initializeMerger(moduleId);

                expect(dataStoreService.createExcludedOptions).toHaveBeenCalledWith(projectId, moduleId, localExcludedLineListOptions);
            });

            it('should gracefully return if remoteData and localData lastUpdatedTimes are same', function () {
                var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
                var remoteExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-19T00:00:00.000Z"});
                dataStoreService.getExcludedOptions.and.returnValue(utils.getPromise(q, remoteExcludedLineListOptions));
                excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));

                initializeMerger(moduleId);

                expect(dataStoreService.updateExcludedOptions).not.toHaveBeenCalledWith(moduleId, localExcludedLineListOptions);
                expect(excludedLineListOptionsRepository.upsert).not.toHaveBeenCalledWith(remoteExcludedLineListOptions);
            });
        });
    });
});