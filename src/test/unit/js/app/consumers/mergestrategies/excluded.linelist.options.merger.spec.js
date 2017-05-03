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
            spyOn(dataStoreService, 'getKeysForExcludedOptions').and.returnValue(utils.getPromise(q, undefined));

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

        describe('mergeAndSaveForProject', function() {
            var projectId = "someProjectId";

            var initializeMerger = function (projectId) {
                orgUnitRepository.getParentProject.and.returnValue(utils.getPromise(q, {id: projectId}));
                excludedLinelistOptionsMerger.mergeAndSaveForProject(projectId);
                scope.$apply();
            };

            it('should get all modules for specified project', function () {
                initializeMerger(projectId);
                expect(orgUnitRepository.getAllModulesInOrgUnits).toHaveBeenCalledWith(projectId);
            });

            it('should get all existing keys from remote data store', function () {
                initializeMerger(projectId);
                expect(dataStoreService.getKeysForExcludedOptions).toHaveBeenCalled();
            });

            it('should merge data only for modules that exist both in local and remote', function () {
                var remoteKeys = [
                    'mod1_excludedOptions',
                    'mod2_excludedOptions',
                    'mod3_excludedOptions'
                ];
                var moduleIds = [{id: 'mod2'}, {id: 'mod3'}, {id: 'mod4'}];

                dataStoreService.getKeysForExcludedOptions.and.returnValue(utils.getPromise(q, remoteKeys));
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, moduleIds));
                initializeMerger(projectId);

                expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith("mod2");
                expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith("mod3");
                expect(dataStoreService.getExcludedOptions).toHaveBeenCalledWith(projectId, "mod2");
                expect(dataStoreService.getExcludedOptions).toHaveBeenCalledWith(projectId, "mod3");
            });

            it('should gracefully return if localData is latest over remote data', function () {
                var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-21T00:00:00.000Z"});
                var remoteExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-20T00:00:00.000Z"});
                dataStoreService.getExcludedOptions.and.returnValue(utils.getPromise(q, remoteExcludedLineListOptions));
                excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));
                var remoteKeys = [
                    'mod1_excludedOptions',
                    'mod2_excludedOptions',
                    'mod3_excludedOptions'
                ];
                var moduleIds = [{id: 'mod2'}, {id: 'mod3'}, {id: 'mod4'}];

                dataStoreService.getKeysForExcludedOptions.and.returnValue(utils.getPromise(q, remoteKeys));
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, moduleIds));
                initializeMerger(projectId);

                expect(dataStoreService.updateExcludedOptions).not.toHaveBeenCalled();
            });

            it('should update localData if there is data on remote but there is no localData', function () {
                var localExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: undefined});
                var remoteExcludedLineListOptions = mockExcludedLineListOptions({clientLastUpdated: "2016-05-20T00:00:00.000Z"});
                dataStoreService.getExcludedOptions.and.returnValue(utils.getPromise(q, remoteExcludedLineListOptions));
                excludedLineListOptionsRepository.get.and.returnValue(utils.getPromise(q, localExcludedLineListOptions));
                var remoteKeys = [
                    'mod1_excludedOptions',
                    'mod2_excludedOptions',
                    'mod3_excludedOptions'
                ];
                var moduleIds = [{id: 'mod2'}, {id: 'mod3'}, {id: 'mod4'}];

                dataStoreService.getKeysForExcludedOptions.and.returnValue(utils.getPromise(q, remoteKeys));
                orgUnitRepository.getAllModulesInOrgUnits.and.returnValue(utils.getPromise(q, moduleIds));
                initializeMerger(projectId);

                expect(dataStoreService.createExcludedOptions).not.toHaveBeenCalled();
                expect(excludedLineListOptionsRepository.upsert).toHaveBeenCalledWith(remoteExcludedLineListOptions);
            });
        });
    });
});