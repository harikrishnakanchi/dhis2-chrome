define(["downloadPatientOriginConsumer", "patientOriginService", "utils", "angularMocks", "patientOriginRepository", "timecop"],
    function(DownloadPatientOriginConsumer, PatientOriginService, utils, mocks, PatientOriginRepository, timecop) {
        var downloadPatientOriginConsumer, patientOriginService, q, allPatientOriginDetails, patientOriginRepository, scope;
        describe("download patient origin consumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope) {
                scope = $rootScope.$new();
                q = $q;
                allPatientOriginDetails = [{
                    key: "prj1",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        origins: [{
                            'originName': 'origin1',
                            'latitude': '80',
                            'longitude': '180'
                        }, {
                            'originName': 'origin2',
                            'latitude': '80',
                            'longitude': '180'
                        }]
                    }
                }, {
                    key: "prj2",
                    value: {
                        clientLastUpdated: "2014-05-30T12:43:54.972Z",
                        origins: []
                    }
                }];
                patientOriginService = new PatientOriginService();
                patientOriginRepository = new PatientOriginRepository();
            }));

            it("should download excluded data elements", function() {
                spyOn(patientOriginService, "getAll").and.returnValue(utils.getPromise(q, allPatientOriginDetails));
                spyOn(patientOriginRepository, "upsert");
                spyOn(patientOriginRepository, "findAll").and.returnValue(utils.getPromise(q, undefined));
                downloadPatientOriginConsumer = new DownloadPatientOriginConsumer(patientOriginService, patientOriginRepository);

                downloadPatientOriginConsumer.run();
                scope.$apply();
                expect(patientOriginService.getAll).toHaveBeenCalled();
                expect(patientOriginRepository.upsert).toHaveBeenCalledWith(allPatientOriginDetails);
            });

            it("should not overwrite locally modified setting", function() {

                var locallyModifiedSetting = {
                    key: "prj1",
                    value: {
                        clientLastUpdated: "2014-05-30T12:50:54.972Z",
                        origins: [{
                            'originName': 'origin1',
                            'latitude': '80',
                            'longitude': '180'
                        }]
                    }
                };

                var expectedUpserts = [
                    locallyModifiedSetting, {
                        key: "prj2",
                        value: {
                            clientLastUpdated: "2014-05-30T12:43:54.972Z",
                            origins: []
                        }
                    }
                ];

                spyOn(patientOriginService, "getAll").and.returnValue(utils.getPromise(q, allPatientOriginDetails));
                spyOn(patientOriginRepository, "upsert");
                spyOn(patientOriginRepository, "findAll").and.returnValue(utils.getPromise(q, [locallyModifiedSetting]));

                downloadPatientOriginConsumer = new DownloadPatientOriginConsumer(patientOriginService, patientOriginRepository);
                downloadPatientOriginConsumer.run();

                scope.$apply();

                expect(patientOriginService.getAll).toHaveBeenCalled();
                expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
            });

            it("should overwrite locally modified setting", function() {

                var locallyModifiedSetting = {
                    key: "prj1",
                    value: {
                        clientLastUpdated: "2014-05-30T12:41:54.972Z",
                        origins: [{
                            'originName': 'origin1',
                            'latitude': '80',
                            'longitude': '180'
                        }]
                    }
                };

                var expectedUpserts = allPatientOriginDetails;

                spyOn(patientOriginService, "getAll").and.returnValue(utils.getPromise(q, allPatientOriginDetails));
                spyOn(patientOriginRepository, "upsert");
                spyOn(patientOriginRepository, "findAll").and.returnValue(utils.getPromise(q, [locallyModifiedSetting]));

                downloadPatientOriginConsumer = new DownloadPatientOriginConsumer(patientOriginService, patientOriginRepository);
                downloadPatientOriginConsumer.run();

                scope.$apply();

                expect(patientOriginService.getAll).toHaveBeenCalled();
                expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedUpserts);
            });
        });
    });
