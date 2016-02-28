define(["pivotTableRepository", "angularMocks", "utils"], function(PivotTableRepository, mocks, utils) {
    describe('Pivot Table Repository', function() {
        var mockStore, pivotTableRepository, q, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            mockDB = utils.getMockDB($q);
            q = $q;
            scope = $rootScope.$new();
            mockStore = mockDB.objectStore;

            pivotTableRepository = new PivotTableRepository(mockDB.db, q);
        }));

        it('should upsert the pivot tables', function() {
            var pivotTablesToUpsert = [{
                'id': 'newPivotTableId',
                'title': 'New PivotTable'
            }, {
                'id': 'existingPivotTableId',
                'title': 'Updated PivotTable'
            }];

            pivotTableRepository.upsert(pivotTablesToUpsert);
            scope.$apply();

            expect(mockStore.upsert).toHaveBeenCalledWith(pivotTablesToUpsert);
        });

        it('should remove pivot tables by id', function() {
            var pivotTableIds = ['1', '2'];
            var dbPivotTables = [{
                "name": "pivot table 1",
                "id": "1"
            }, {
                "name": "pivot table 2",
                "id": "2"
            }, {
                "name": "pivot table 3",
                "id": "3"
            }];
            pivotTableRepository.deleteByIds(pivotTableIds, dbPivotTables);
            expect(mockStore.delete).toHaveBeenCalledWith('pivot table 1');
            expect(mockStore.delete).toHaveBeenCalledWith('pivot table 2');
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
