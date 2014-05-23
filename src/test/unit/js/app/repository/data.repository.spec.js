define(["dataRepository", "angularMocks", "utils"], function(DataRepository, mocks, utils) {
    describe("data repository", function() {
        var db, mockStore, dataRepository, dataValues;
        beforeEach(mocks.inject(function($q) {
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            dataRepository = new DataRepository(mockDB.db);
            dataValues = {
                dataValues: [{
                    period: '2014W15',
                    orgUnit: 'company_0',
                    dataElement: "DE1",
                    categoryOptionCombo: "COC1",
                    value: 1,
                }, {
                    period: '2014W15',
                    orgUnit: 'company_0',
                    dataElement: "DE2",
                    categoryOptionCombo: "COC2",
                    value: 2,
                }]
            };
        }));

        it("should save data values", function() {
            dataRepository.save(dataValues);
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                period: '2014W15',
                dataValues: dataValues.dataValues,
                "orgUnit": "company_0"
            }]);
        });

        it("should save data values as draft", function() {
            dataRepository.saveAsDraft(dataValues);
            expect(mockStore.upsert).toHaveBeenCalledWith([{
                period: '2014W15',
                dataValues: dataValues.dataValues,
                "orgUnit": "company_0",
                "isDraft": true
            }]);
        });

        it("should get the data values", function() {
            dataRepository.getDataValues('period', 'orgUnitId');
            expect(mockStore.find).toHaveBeenCalledWith(['period', 'orgUnitId']);
        });

    });
});