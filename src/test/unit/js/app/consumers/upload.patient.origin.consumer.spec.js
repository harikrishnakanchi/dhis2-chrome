define(["uploadPatientOriginConsumer", "angularMocks", "utils", "dataStoreService", "patientOriginRepository", "mergeBy", "orgUnitRepository"],
    function(UploadPatientOriginConsumer, mocks, utils, DataStoreService, PatientOriginRepository, MergeBy, OrgUnitRepository) {

        var scope, q, dataStoreService, patientOriginRepository, uploadPatientOriginConsumer, mockMessage, patientOriginDetails, http, mergeBy, orgUnitRepository;

        describe("uploadPatientOriginConsumer", function() {
            beforeEach(mocks.inject(function($q, $rootScope, $http, $log) {
                scope = $rootScope.$new();
                q = $q;
                http = $http;
                mergeBy = new MergeBy($log);
                mockMessage = {
                    "data": {
                        "data": "opUnit1",
                        "type": "uploadPatientOriginDetails"
                    }
                };

                patientOriginDetails = {
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin1",
                        "originName": "origin1",
                        "longitude": 180,
                        "latitude": 80,
                        "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                    }]
                };
                dataStoreService = new DataStoreService(http);
                spyOn(dataStoreService, "getPatientOrigins").and.returnValue(utils.getPromise(q, undefined));
                spyOn(dataStoreService, "createPatientOrigins").and.returnValue(utils.getPromise(q, undefined));
                spyOn(dataStoreService, "updatePatientOrigins").and.returnValue(utils.getPromise(q, undefined));

                patientOriginRepository = new PatientOriginRepository();
                spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, patientOriginDetails));
                spyOn(patientOriginRepository, "upsert").and.returnValue(utils.getPromise(q, undefined));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'getParentProject').and.returnValue(utils.getPromise(q, {id: "prj1"}));

                uploadPatientOriginConsumer = new UploadPatientOriginConsumer(q, dataStoreService, patientOriginRepository, orgUnitRepository, mergeBy);
            }));

            it("should get patient origins for specified opUnit from dhis", function() {
                uploadPatientOriginConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.getPatientOrigins).toHaveBeenCalledWith("prj1", "opUnit1");
            });

            it('should get projectId for specified opUnit', function () {
                uploadPatientOriginConsumer.run(mockMessage);
                scope.$apply();

                expect(orgUnitRepository.getParentProject).toHaveBeenCalledWith('opUnit1');
            });

            it('should get local patient origins', function () {
                uploadPatientOriginConsumer.run(mockMessage);
                scope.$apply();

                expect(patientOriginRepository.get).toHaveBeenCalledWith("opUnit1");
            });

            it('should upload patient origins to DHIS if remote data is not present', function () {
                dataStoreService.getPatientOrigins.and.returnValue(utils.getPromise(q, undefined));
                uploadPatientOriginConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.createPatientOrigins).toHaveBeenCalledWith('prj1', 'opUnit1', patientOriginDetails);
            });

            it('should merge the local and remote origins based on lastUpdated time', function () {
                var remotePatientOrigin = {
                    "orgUnit": "opUnit1",
                    "origins": [{
                        "id": "origin1",
                        "originName": "origin1Edited",
                        "clientLastUpdated": "2014-05-30T12:50:54.972Z"
                    }, {
                        "id": "origin2",
                        "originName": "origin2Name",
                        "clientLastUpdated": "2014-05-30T12:43:54.972Z"
                    }]
                };
                dataStoreService.getPatientOrigins.and.returnValue(utils.getPromise(q, remotePatientOrigin));
                uploadPatientOriginConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.updatePatientOrigins).toHaveBeenCalledWith('prj1', 'opUnit1', remotePatientOrigin);
                expect(patientOriginRepository.upsert).toHaveBeenCalledWith(remotePatientOrigin);
            });
        });
    });
