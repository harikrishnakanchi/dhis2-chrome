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
                'name': 'Origin1',
                'longitude': 100,
                'latitude': 80,
                'clientLastUpdated': '2014-05-30T12:43:54.972Z'
            }];

            Timecop.install();
            Timecop.freeze(new Date("2014-04-01T00:00:00.000Z"));

        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should set patientOriginDetails on scope on initialization", function() {
            scope.orgUnit = {
                'id': 'prj1'
            };
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {
                'orgUnit': 'prj1',
                'origins': origins
            }));
            patientOriginController = new PatientOriginController(scope, hustle, patientOriginRepository);
            scope.$apply();

            expect(patientOriginRepository.get).toHaveBeenCalledWith("prj1");
        });

        it("should save patientOriginDetails if no origin details are present", function() {
            spyOn(patientOriginRepository, "get").and.returnValue(utils.getPromise(q, {}));
            patientOriginController = new PatientOriginController(scope, hustle, patientOriginRepository);
            scope.patientOrigin = {
                'name': 'Origin1',
                'longitude': 100,
                'latitude': 80
            };
            scope.$apply();

            scope.save();
            scope.$apply();

            var expectedPayload = {
                orgUnit: 'prj1',
                origins: [{
                    'id': 'Origin1',
                    'name': 'Origin1',
                    'longitude': 100,
                    'latitude': 80,
                    clientLastUpdated: '2014-04-01T00:00:00.000Z',
                }]
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
                'orgUnit': 'prj1',
                'origins': origins
            }));
            patientOriginController = new PatientOriginController(scope, hustle, patientOriginRepository);
            scope.patientOrigin = {
                'name': 'Origin2',
                'longitude': 100,
                'latitude': 80
            };
            scope.$apply();

            scope.save();
            scope.$apply();

            var expectedPayload = {
                orgUnit: 'prj1',
                origins: [{
                    'id': 'origin1',
                    'name': 'Origin1',
                    'longitude': 100,
                    'latitude': 80,
                    'clientLastUpdated': '2014-05-30T12:43:54.972Z'
                }, {
                    'id': 'Origin2',
                    'name': 'Origin2',
                    'longitude': 100,
                    'latitude': 80,
                    'clientLastUpdated': '2014-04-01T00:00:00.000Z',
                }]
            };
            expect(patientOriginRepository.upsert).toHaveBeenCalledWith(expectedPayload);
            expect(hustle.publish).toHaveBeenCalledWith({
                data: expectedPayload,
                type: "uploadPatientOriginDetails"
            }, "dataValues");
        });
    });
});
