define(["patientOriginController", "angularMocks", "utils", "dhisId", "timecop"], function(PatientOriginController, mocks, utils, dhisId, timecop) {
    describe("patientOriginController", function() {
        var scope, patientOriginController, q, patientOriginRepository, hustle, origins;

        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
            scope = $rootScope.$new();
            q = $q;
            hustle = $hustle;
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            spyOn(dhisId, "get").and.callFake(function(name) {
                return name;
            });
            scope.orgUnit = {
                "name": "Project1",
                "id": "prj1"
            };

            patientOriginRepository = utils.getMockRepo(q);
            patientOriginRepository.get = function() {};

            origins = [{
                'id': 'origin1',
                'originName': 'Origin1',
                'longitude': 100,
                'latitude': 80
            }];

            Timecop.install();
            Timecop.freeze(new Date("2014-04-01T00:00:00.000Z"));

        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should set patientOriginDetails on scope on initialization", function() {
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {
                'key': 'prj1',
                'value': {
                    'clientLastUpdated': "2014-05-30T12:43:54.972Z",
                    'origins': origins
                }
            }));
            patientOriginController = new PatientOriginController(scope, hustle, patientOriginRepository);
            scope.$apply();

            expect(scope.projectOrigins).toEqual(origins);
        });

        it("should save patientOriginDetails if no origin details are present", function() {
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {}));
            patientOriginController = new PatientOriginController(scope, hustle, patientOriginRepository);
            scope.$apply();

            scope.save({
                'originName': 'Origin1',
                'longitude': 100,
                'latitude': 80
            });
            scope.$apply();

            var expectedPayload = {
                key: 'prj1',
                value: {
                    clientLastUpdated: '2014-04-01T00:00:00.000Z',
                    origins: [{
                        'id': 'Origin1',
                        'originName': 'Origin1',
                        'longitude': 100,
                        'latitude': 80
                    }]
                }
            };
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedPayload,
                type: "uploadPatientOriginDetails"
            }, "dataValues");
            expect(scope.saveFailure).toEqual(false);
        });

        it("should save patientOriginDetails if origin details are already present", function() {
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {
                'key': 'prj1',
                'value': {
                    'clientLastUpdated': "2014-05-30T12:43:54.972Z",
                    'origins': origins
                }
            }));
            patientOriginController = new PatientOriginController(scope, hustle, patientOriginRepository);
            scope.$apply();

            scope.save({
                'originName': 'Origin2',
                'longitude': 100,
                'latitude': 80
            });
            scope.$apply();

            var expectedPayload = {
                key: 'prj1',
                value: {
                    clientLastUpdated: '2014-04-01T00:00:00.000Z',
                    origins: [{
                        'id': 'origin1',
                        'originName': 'Origin1',
                        'longitude': 100,
                        'latitude': 80
                    }, {
                        'id': 'Origin2',
                        'originName': 'Origin2',
                        'longitude': 100,
                        'latitude': 80
                    }]
                }
            };
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedPayload,
                type: "uploadPatientOriginDetails"
            }, "dataValues");
        });
    });
});
