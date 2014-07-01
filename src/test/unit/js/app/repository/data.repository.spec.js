define(["dataRepository", "angularMocks", "utils"], function(DataRepository, mocks, utils) {
    describe("data repository", function() {
        var q, db, mockStore, dataRepository, dataValues, scope;
        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;
            scope = $rootScope;
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

        it("should get the complete data values", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15'
            }));
            dataRepository.getCompleteDataValues('period', 'orgUnitId');
            expect(mockStore.find).toHaveBeenCalledWith(['period', 'orgUnitId']);
        });

        it("should unapprove data at level one", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, {
                period: '2014W15'
            }));

            dataRepository.unapproveLevelOneData("period", "orgUnitId");
            scope.$apply();

            expect(mockStore.find).toHaveBeenCalledWith(["period", "orgUnitId"]);
            expect(mockStore.upsert).toHaveBeenCalledWith({
                period: '2014W15',
                "isDeleted": true
            });
        });

        it("should not approve if data is not available for approval", function() {
            mockStore.find.and.returnValue(utils.getPromise(q, undefined));

            dataRepository.unapproveLevelOneData("period", "orgUnitId");
            scope.$apply();

            expect(mockStore.upsert).not.toHaveBeenCalled();
        });
    });
});