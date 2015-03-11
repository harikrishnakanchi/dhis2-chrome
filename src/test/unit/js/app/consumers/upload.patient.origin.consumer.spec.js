define(["uploadPatientOriginConsumer", "patientOriginService", "utils", "angularMocks", "patientOriginRepository"],
    function(UploadPatientOriginConsumer, PatientOriginService, utils, mocks, PatientOriginRepository) {
        var scope, patientOriginRepository, patientOriginService, q;

        describe("upload system settings uploadPatientOriginConsumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope.$new();
                q = $q;
                patientOriginService = new PatientOriginService();
                patientOriginRepository = new PatientOriginRepository();
            }));

            it("should upload system settings", function() {
                var payload = {
                    orgUnit: "prj1",
                    origins: [{
                        "id": "origin1",
                        "originName": "origin1",
                        "longitude": 180,
                        "latitude": 80,
                        "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                    }]
                };

                var message = {
                    data: {
                        data: payload,
                        type: "uploadPatientOriginDetails"
                    }
                };

                spyOn(patientOriginService, "upsert");
                spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, payload));
                var uploadPatientOriginConsumer = new UploadPatientOriginConsumer(patientOriginService, patientOriginRepository, q);
                uploadPatientOriginConsumer.run(message);
                scope.$apply();

                expect(patientOriginRepository.get).toHaveBeenCalledWith("prj1");
                expect(patientOriginService.upsert).toHaveBeenCalledWith(payload);
            });
        });
    });
