define(["uploadExcludedDataElementsConsumer", "utils", "angularMocks", "systemSettingService", "excludedDataElementsRepository", "orgUnitRepository"],
    function(UploadExcludedDataElementsConsumer, utils, mocks, SystemSettingService, ExcludedDataElementsRepository, OrgUnitRepository) {
        describe("uploadExcludedDataElementsConsumer", function() {
            var uploadExcludedDataElementsConsumer, systemSettingService, excludedDataElementsRepository, orgUnitRepository, q, scope;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                systemSettingService = new SystemSettingService();
                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                orgUnitRepository = new OrgUnitRepository();
            }));

            it("should save excluded DataElements to dhis", function() {
                var project = {
                    "id": "prj1"
                };

                var excludedDataElements = {
                    "orgUnit": "mod1",
                    "dataElements": ["de1", "de2"],
                    "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                };

                var message = {
                    "data": {
                        "data": "mod1",
                        "type": "uploadExcludedDataElements"
                    }
                };

                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, project));
                spyOn(excludedDataElementsRepository, "get").and.returnValue(utils.getPromise(q, excludedDataElements));
                spyOn(systemSettingService, "upsertExcludedDataElements").and.returnValue(utils.getPromise(q, {}));

                uploadExcludedDataElementsConsumer = new UploadExcludedDataElementsConsumer(q, systemSettingService, excludedDataElementsRepository, orgUnitRepository);
                uploadExcludedDataElementsConsumer.run(message);
                scope.$apply();

                expect(orgUnitRepository.getParentProject).toHaveBeenCalledWith("mod1");
                expect(excludedDataElementsRepository.get).toHaveBeenCalledWith("mod1");
                expect(systemSettingService.upsertExcludedDataElements).toHaveBeenCalledWith(project.id, excludedDataElements);
            });
        });
    });
