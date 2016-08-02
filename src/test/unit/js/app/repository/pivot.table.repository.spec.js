define(["pivotTableRepository", "pivotTable", "angularMocks", "utils", "lodash"], function(PivotTableRepository, PivotTable, mocks, utils, _) {
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
            var pivotTableIdA = 'pivotTableIdA',
                pivotTableIdB = 'pivotTableIdB';
            pivotTableRepository.deleteByIds([pivotTableIdA, pivotTableIdB]);
            expect(mockStore.delete).toHaveBeenCalledWith(pivotTableIdA);
            expect(mockStore.delete).toHaveBeenCalledWith(pivotTableIdB);
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

        describe('getAll', function() {
            it('should get all the pivot tables', function () {
                var allPivotTables = [{
                    'id': 'pivotTable1'
                }, {
                    'id': 'pivotTable2'
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, allPivotTables));

                pivotTableRepository.getAll().then(function (pivotTablesFromRepository) {
                    expect(_.pluck(pivotTablesFromRepository, 'id')).toEqual(['pivotTable1', 'pivotTable2']);
                    expect(pivotTablesFromRepository).toEqual([jasmine.any(PivotTable), jasmine.any(PivotTable)]);
                });
                scope.$apply();

                expect(mockStore.getAll).toHaveBeenCalled();
            });
        });
    });
});
