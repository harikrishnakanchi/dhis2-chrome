define(["indicatorRepository", "angularMocks", "utils"], function(IndicatorRepository, mocks, utils) {
    describe("indicator repository", function() {
        var indicatorRepository, db, mockStore, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            indicatorRepository = new IndicatorRepository(mockDB.db);
        }));

        it("should get all indicators required for field app reports", function() {
            var newConsultationsIndicatorNeededForReport = {
                "id": "newConsultation",
                "name": "New Consultation - OPD General",
                "numerator": "#{newCon}",
                "denominator": "#{newCon}+#{followupCon}",
                "indicatorType": {
                    "id": "percentage",
                    "name": "Percentage",
                },
                "attributeValues": [{
                    "value": "true",
                    "attribute": {
                        "id": "a73a9d955c2",
                        "name": "Show In Field Reports",
                        "code": "showInFieldReports",
                    }
                }]
            };

            var admissionsIndicatorNotNeededForReport = {
                "id": "admissions",
                "name": "Admissions - V1",
                "numerator": "#{adm}",
                "denominator": "1",
                "indicatorType": {
                    "id": "factor",
                    "name": "Factor1",
                },
                "attributeValues": []
            };

            var allIndicators = [newConsultationsIndicatorNeededForReport, admissionsIndicatorNotNeededForReport];

            mockStore.getAll.and.returnValue(utils.getPromise(q, allIndicators));
            var actualData;
            indicatorRepository.getAll().then(function(data) {
                actualData = data;
            });
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(actualData).toEqual([newConsultationsIndicatorNeededForReport]);
        });


    });
});