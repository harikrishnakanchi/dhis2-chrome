define(["originOrgunitCreator", "angularMocks", "utils", "lodash", "orgUnitRepository", "patientOriginRepository", "dhisId", "orgUnitGroupHelper", "dataSetRepository", "orgUnitMapper"],
    function(OriginOrgunitCreator, mocks, utils, _, OrgUnitRepository, PatientOriginRepository, dhisId, OrgUnitGroupHelper, DatasetRepository, orgUnitMapper) {
        describe("origin orgunit creator", function() {

            var scope, mockOrigin, q, originOrgunitCreator, orgUnitRepository, patientOriginRepository, orgUnitGroupHelper, dataSetRepository;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($rootScope, $q) {
                scope = $rootScope.$new();
                q = $q;

                mockOrigin = {
                    id: 'mockOriginId',
                    name: 'someName'
                };

                orgUnitRepository = new OrgUnitRepository();
                patientOriginRepository = new PatientOriginRepository();
                orgUnitGroupHelper = new OrgUnitGroupHelper();
                dataSetRepository = new DatasetRepository();

                spyOn(orgUnitRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                spyOn(dataSetRepository, "getAll").and.returnValue(utils.getPromise(q, {}));

                spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, mockOrigin));

                spyOn(orgUnitGroupHelper, "createOrgUnitGroups");

                spyOn(dhisId, "get").and.callFake(function(name) {
                    return name;
                });

                spyOn(orgUnitMapper, "createPatientOriginPayload").and.returnValue([mockOrigin]);

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

            var createMockOrigin = function (options) {
                return _.merge({
                    id: 'mockOriginId',
                    name: 'someName'
                }, options);
            };

            describe('create', function () {
                var module, patientOrigin, mockOriginDataset;
                beforeEach(function () {
                    module = createModule();
                    patientOrigin = {
                        "id": "mockOriginId",
                        "name": "someName"
                    };
                    mockOriginDataset = {
                        id: 'originDataSet',
                        isOriginDataset: true
                    };
                });

                it("should create patient origin payload for the given patient origin", function() {
                    originOrgunitCreator.create(module, patientOrigin);
                    scope.$apply();

                    expect(orgUnitMapper.createPatientOriginPayload).toHaveBeenCalledWith([createMockOrigin()], module);
                });

                it('should associate and upsert geographic origins dataSets if associateGeographicOrigin flag is set to true', function () {
                    var associateGeographicOrigins = true;

                    dataSetRepository.getAll.and.returnValue(utils.getPromise(q, [mockOriginDataset]));
                    originOrgunitCreator.create(module, patientOrigin, associateGeographicOrigins);
                    scope.$apply();


                    var enrichedOriginWithDataSet = createMockOrigin({ dataSets: [{ id: mockOriginDataset.id }]});
                    expect(orgUnitRepository.upsert).toHaveBeenCalledWith([enrichedOriginWithDataSet]);
                });

                it('should not associate geographic origins dataSets if associateGeographicOrigin flag is set to false', function () {
                    var associateGeographicOrigins = false;

                    dataSetRepository.getAll.and.returnValue(utils.getPromise(q, [mockOriginDataset]));
                    originOrgunitCreator.create(module, patientOrigin, associateGeographicOrigins);
                    scope.$apply();

                    var enrichedOriginWithDataSet = createMockOrigin({ dataSets: []});
                    expect(orgUnitRepository.upsert).toHaveBeenCalledWith([enrichedOriginWithDataSet]);
                });
            });

            it("should get patient origin info from repository if no patient origin is passed", function() {
                var module = createModule();

                originOrgunitCreator.create(module);
                scope.$apply();

                expect(patientOriginRepository.get).toHaveBeenCalledWith(module.parent.id);
            });
        });
    });
