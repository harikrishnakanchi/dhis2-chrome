define(["uploadPatientOriginConsumer", "angularMocks", "utils", "systemSettingService", "patientOriginRepository", "orgUnitRepository"],
    function(UploadPatientOriginConsumer, mocks, utils, SystemSettingService, PatientOriginRepository, OrgUnitRepository) {

        var scope, q, systemSettingService, patientOriginRepository, orgUnitRepository;

        describe("uploadPatientOriginConsumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope.$new();
                q = $q;
                systemSettingService = new SystemSettingService();
                patientOriginRepository = new PatientOriginRepository();
                orgUnitRepository = new OrgUnitRepository();
            }));

            it("should upload patient origin data to dhis", function() {
                var project = {
                    "id": "prj1"
                };

                var patientOriginDetails = {
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin1",
                        "originName": "origin1",
                        "longitude": 180,
                        "latitude": 80,
                        "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                    }]
                };

                var message = {
                    "data": {
                        "data": "opUnit1",
                        "type": "uploadPatientOriginDetails"
                    }
                };

                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, project));
                spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, patientOriginDetails));
                spyOn(systemSettingService, "upsertPatientOriginDetails").and.returnValue(utils.getPromise(q, {}));

                var consumer = new UploadPatientOriginConsumer(q, systemSettingService, patientOriginRepository, orgUnitRepository);
                consumer.run(message);
                scope.$apply();

                expect(orgUnitRepository.getParentProject).toHaveBeenCalledWith("opUnit1");
                expect(patientOriginRepository.get).toHaveBeenCalledWith("opUnit1");
                expect(systemSettingService.upsertPatientOriginDetails).toHaveBeenCalledWith(project.id, patientOriginDetails);
            });
        });
    });
