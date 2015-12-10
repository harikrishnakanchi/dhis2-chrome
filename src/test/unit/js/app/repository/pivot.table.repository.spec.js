define(["pivotTableRepository", "angularMocks", "utils"], function(PivotTableRepository, mocks, utils) {
    describe('Pivot Table Repository', function() {
        var mockStore, pivotTableRepository, q, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            mockDB = utils.getMockDB($q);
            q = $q;
            scope = $rootScope.$new();
            mockStore = mockDB.objectStore;

            pivotTableRepository = new PivotTableRepository(mockDB.db);
        }));

        it('should save the tables', function() {
            var tables = [{
                'id': 'new pivot table id',
                'title': 'The pivot table'
            }];

            pivotTableRepository.replaceAll(tables);
            scope.$apply();

            expect(mockStore.clear).toHaveBeenCalled();
            expect(mockStore.upsert).toHaveBeenCalledWith(tables);
        });

        it('should save table data', function() {
            var data = {
                'metaData': 'pivot tableId'
            };

            pivotTableRepository.upsertPivotTableData('The pivot table', 'orgUnitId', data);

            expect(mockStore.upsert).toHaveBeenCalledWith({
                pivotTable: 'The pivot table',
                orgUnit: 'orgUnitId',
                data: data
            });
        });

        it('should get All the tables', function() {
            pivotTableRepository.getAll();
            expect(mockStore.getAll).toHaveBeenCalled();
        });
    });
});
