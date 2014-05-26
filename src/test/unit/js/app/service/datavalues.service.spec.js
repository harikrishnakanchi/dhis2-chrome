define(["dataValuesService", "angularMocks", "properties", "utils", "dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository"],
    function(DataValuesService, mocks, properties, utils, DataService, DataRepository, DataSetRepository, UserPreferenceRepository) {
        describe("data values service", function() {

            var dataService, dataRepository, dataSetRepository, userPreferenceRepository, q, scope, allDataSets, userPref;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                dataService = new DataService();
                dataRepository = new DataRepository();
                dataSetRepository = new DataSetRepository();
                userPreferenceRepository = new UserPreferenceRepository();

                dataValuesService = new DataValuesService(dataService, dataRepository, dataSetRepository, userPreferenceRepository, q);

                userPref = [{
                    "orgUnits": [{
                        "id": "org_0"
                    }]
                }];

                allDataSets = [{
                    "id": "DS_OPD"
                }];
            }));

            it("should sync data values if org units and datasets are present", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));

                dataValuesService.sync();
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).toHaveBeenCalled();
            });

            it("should not sync data values if org units is not present", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, allDataSets));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));

                dataValuesService.sync();
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });

            it("should not sync data values if dataSets is not present", function() {
                spyOn(userPreferenceRepository, "getAll").and.returnValue(utils.getPromise(q, userPref));
                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, []));
                spyOn(dataRepository, "save");
                spyOn(dataService, "downloadAllData").and.returnValue(utils.getPromise(q, []));

                dataValuesService.sync();
                scope.$apply();

                expect(userPreferenceRepository.getAll).toHaveBeenCalled();
                expect(dataSetRepository.getAll).toHaveBeenCalled();
                expect(dataService.downloadAllData).not.toHaveBeenCalled();
            });
        });
    });