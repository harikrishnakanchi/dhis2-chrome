define(["patientOriginRepository", "angularMocks", "utils"], function(PatientOriginRepository, mocks, utils) {
    describe("patientOriginRepository", function() {
        var patientOriginRepository, downloadedSettings, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            patientOriginRepository = new PatientOriginRepository(mockDB.db);

        }));

        it("should upsert patient origin details", function() {
            var patientOriginDetails = {
                "key": "prj1",
                "value": {
                    "clientLastUpdated": "2015-01-01T11:00:00.000Z",
                    "origins": [{
                        "originName": "origin1",
                        "longitude": 180,
                        "latitude": 80
                    }]
                }
            };
            patientOriginRepository.upsert(patientOriginDetails);
            expect(mockStore.upsert).toHaveBeenCalledWith([patientOriginDetails]);
        });

        it("should find all settings for projects", function() {
            var projectIds = ["prj1", "prj2", "prj3"];
            var orgUnit = patientOriginRepository.findAll(projectIds);
            scope.$apply();

            expect(mockStore.each).toHaveBeenCalled();
            expect(mockStore.each.calls.argsFor(0)[0].inList).toEqual(projectIds);
        });

        it("should find all patient origin details given a project id", function() {
            var projectId = "12445";
            patientOriginRepository.get(projectId).then(function(data) {
                expect(data).toEqual({});
            });
            expect(mockStore.find).toHaveBeenCalledWith(projectId);
        });

    });
});
