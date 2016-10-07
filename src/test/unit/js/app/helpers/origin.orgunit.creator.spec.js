define(["originOrgunitCreator", "angularMocks", "utils", "lodash", "orgUnitRepository", "patientOriginRepository", "dhisId", "orgUnitGroupHelper", "dataSetRepository"],
    function(OriginOrgunitCreator, mocks, utils, _, OrgUnitRepository, PatientOriginRepository, dhisId, OrgUnitGroupHelper, DatasetRepository) {
        describe("origin orgunit creator", function() {

            var scope, q, originOrgunitCreator, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper, dataSetRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;

                orgUnitRepository = new OrgUnitRepository();
                patientOriginRepository = new PatientOriginRepository();
                orgUnitGroupHelper = new OrgUnitGroupHelper();
                dataSetRepository = new DatasetRepository();

                spyOn(orgUnitRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, {}));

                spyOn(patientOriginRepository, "get");

                spyOn(orgUnitGroupHelper, "createOrgUnitGroups");

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                originOrgunitCreator = new OriginOrgunitCreator(q, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper, dataSetRepository);
            }));

            var createModule = function (options) {
                return _.merge({
                    id: 'mod1',
                    name: 'mod1',
                    parent: {
                        id: 'opunit1'
                    }
                }, options);
            };

            var createOriginOrgUnit = function (options) {
              return _.merge({
                  "name": 'o1',
                  "shortName": 'o1',
                  "displayName": 'o1',
                  "id": 'o1mod1',
                  "level": 7,
                  "openingDate": undefined,
                  "attributeValues": [{
                      "attribute": {
                          "code": 'Type',
                          "name": 'Type'
                      },
                      "value": 'Patient Origin'
                  }, {
                      "attribute": {
                          "code": 'isNewDataModel',
                          "name": 'Is New Data Model'
                      },
                      "value": 'true'
                  }],
                  "parent": {
                      "id": 'mod1'
                  },
                  "dataSets": []
              }, options);
            };

            describe('create', function () {
                var module, patientOrigin;
                beforeEach(function () {
                    module = createModule();
                    patientOrigin = {
                        "id": "o1",
                        "name": "o1"
                    };
                });

                it("should create origin orgunits for the given patient origin", function() {
                    var originOrgUnit = createOriginOrgUnit();
                    var expectedOriginOrgUnits = [originOrgUnit];
                    originOrgunitCreator.create(module, patientOrigin);
                    scope.$apply();

                    expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOriginOrgUnits);
                });

                it('should upsert origin orgUnit with origin dataSet', function () {
                    var originDataSet = {
                        id: 'originDataSetId',
                        isOriginDataset: true
                    };
                    var mockDataSets = [originDataSet];
                    dataSetRepository.getAll.and.returnValue(utils.getPromise(q, mockDataSets));


                    originOrgunitCreator.create(module, patientOrigin);
                    scope.$apply();

                    var originOrgUnit = createOriginOrgUnit({
                        dataSets: [{
                            id: "originDataSetId"
                        }]
                    });
                    var expectedOriginOrgUnits = [originOrgUnit];
                    expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOriginOrgUnits);
                });

            });

            it("should get patient origin info from repository and create origin org units if no patient origin is passed", function() {
                var module = createModule();

                var patientOrigins = {
                    "origins": [{
                        "id": "o1",
                        "name": "o1"
                    }]
                };

                var originOrgUnit = createOriginOrgUnit();
                var expectedOriginOrgUnits = [originOrgUnit];

                patientOriginRepository.get.and.returnValue(utils.getPromise(q, patientOrigins));

                originOrgunitCreator.create(module);
                scope.$apply();

                expect(orgUnitRepository.upsert).toHaveBeenCalledWith(expectedOriginOrgUnits);
            });
        });
    });
