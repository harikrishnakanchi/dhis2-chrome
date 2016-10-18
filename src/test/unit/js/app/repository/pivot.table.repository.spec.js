define(["pivotTableRepository", "pivotTable", "pivotTableData", "categoryRepository", "angularMocks", "utils", "lodash"], function(PivotTableRepository, PivotTable, PivotTableData, CategoryRepository, mocks, utils, _) {
    describe('Pivot Table Repository', function() {
        var mockStore, pivotTableRepository, categoryRepository, q, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            mockDB = utils.getMockDB($q);
            q = $q;
            scope = $rootScope.$new();
            mockStore = mockDB.objectStore;

            categoryRepository = new CategoryRepository();
            spyOn(categoryRepository, 'getAllCategoryOptions').and.returnValue(utils.getPromise(q, []));

            spyOn(PivotTableData, 'create').and.returnValue({});

            pivotTableRepository = new PivotTableRepository(mockDB.db, q, categoryRepository);
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
                    expect(_.map(pivotTablesFromRepository, 'id')).toEqual(['pivotTable1', 'pivotTable2']);
                    expect(pivotTablesFromRepository).toEqual([jasmine.any(PivotTable), jasmine.any(PivotTable)]);
                });
                scope.$apply();

                expect(mockStore.getAll).toHaveBeenCalled();
            });

            it('should enrich pivot table definitions with the updated category options', function () {
                var allPivotTables = [{
                    id: 'pivotTable1',
                    categoryDimensions: [{
                        categoryOptions: [{id: 'categoryOptionId', name: 'oldName'}]
                    }]
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, allPivotTables));

                var mockCategoryOptions = [{id: 'categoryOptionId', name: 'newName'}];
                categoryRepository.getAllCategoryOptions.and.returnValue(utils.getPromise(q, mockCategoryOptions));

                pivotTableRepository.getAll().then(function (pivotTables) {
                    var categoryOptions = _.first(_.first(pivotTables).categoryDimensions).categoryOptions;
                    expect(_.first(categoryOptions)).toEqual(_.first(mockCategoryOptions));
                });
                scope.$apply();
                expect(categoryRepository.getAllCategoryOptions).toHaveBeenCalled();
            });
        });

        describe('getPivotTableData', function () {
            var orgUnitId, mockPivotTableData, mockPivotTableDataModel, pivotTableDefinition;

            beforeEach(function () {
                orgUnitId = 'someOrgUnitId';
                mockPivotTableData = {
                    data: 'someData'
                };
                mockPivotTableDataModel = 'someInstanceOfModel';
                pivotTableDefinition = {
                    name: 'somePivotTableName'
                };

                mockStore.find.and.returnValue(utils.getPromise(q, mockPivotTableData));
                PivotTableData.create.and.returnValue(mockPivotTableDataModel);
            });

            it('should get the pivotTableData for the specified pivotTable and orgUnit', function () {
                pivotTableRepository.getPivotTableData(pivotTableDefinition, orgUnitId).then(function (pivotTableData) {
                    expect(pivotTableData).toEqual(mockPivotTableDataModel);
                });

                scope.$apply();
                expect(mockStore.find).toHaveBeenCalledWith([pivotTableDefinition.name, orgUnitId]);
                expect(PivotTableData.create).toHaveBeenCalledWith(pivotTableDefinition, mockPivotTableData.data);
            });

            it('should return null if the pivotTableData does not exist', function () {
                mockStore.find.and.returnValue(utils.getPromise(q, null));

                pivotTableRepository.getPivotTableData(pivotTableDefinition, orgUnitId).then(function (pivotTableData) {
                    expect(pivotTableData).toBeNull();
                });

                scope.$apply();
            });
        });
    });
});
