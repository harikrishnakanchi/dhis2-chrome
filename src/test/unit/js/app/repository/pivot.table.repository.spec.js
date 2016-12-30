define(["pivotTableRepository", "pivotTable", "pivotTableData", "categoryRepository", "dataElementRepository", "indicatorRepository", "programIndicatorRepository", "angularMocks", "utils", "lodash"],
    function(PivotTableRepository, PivotTable, PivotTableData, CategoryRepository, DataElementRepository, IndicatorRepository, ProgramIndicatorRepository, mocks, utils, _) {
    describe('Pivot Table Repository', function() {
        var mockStore, pivotTableRepository, categoryRepository, dataElementRepository, indicatorRepository, programIndicatorRepository, q, mockDB;

        beforeEach(mocks.inject(function($q, $rootScope) {
            mockDB = utils.getMockDB($q);
            q = $q;
            scope = $rootScope.$new();
            mockStore = mockDB.objectStore;

            categoryRepository = new CategoryRepository();
            spyOn(categoryRepository, 'enrichWithCategoryOptions').and.callFake(function (arg) { return utils.getPromise(q, arg); });

            dataElementRepository = new DataElementRepository(mockDB.db);
            spyOn(dataElementRepository, 'enrichWithDataElementsDetails');

            indicatorRepository = new IndicatorRepository(mockDB.db);
            spyOn(indicatorRepository, 'enrichWithIndicatorDetails');

            programIndicatorRepository = new ProgramIndicatorRepository(mockDB.db);
            spyOn(programIndicatorRepository, 'enrichWithProgramIndicatorDetails');

            spyOn(PivotTableData, 'create').and.returnValue({});
            pivotTableRepository = new PivotTableRepository(mockDB.db, q, categoryRepository, dataElementRepository, indicatorRepository, programIndicatorRepository);
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
                pivotTableRepository.getAll();
                scope.$apply();

                expect(categoryRepository.enrichWithCategoryOptions).toHaveBeenCalled();
            });

            it('should enrich pivot table definitions with the data dimension details', function () {
                var allPivotTables = [{
                    'id': 'pivotTable1',
                    'dataDimensionItems': [{
                        dataElement: 'someDataElement'
                    }, {
                        indicator: 'someIndicator'
                    }, {
                        programIndicator: 'someProgramIndicator'
                    }]
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, allPivotTables));

                pivotTableRepository.getAll();
                scope.$apply();
                expect(dataElementRepository.enrichWithDataElementsDetails).toHaveBeenCalledWith(['someDataElement']);
                expect(indicatorRepository.enrichWithIndicatorDetails).toHaveBeenCalledWith(['someIndicator']);
                expect(programIndicatorRepository.enrichWithProgramIndicatorDetails).toHaveBeenCalledWith(['someProgramIndicator']);
            });

            it('should get all pivot tables for notifications', function () {
                var allPivotTables = [{
                    name: 'PivotTable1 Notifications'
                }, {
                    name: 'PivotTable2'
                }];
                mockStore.getAll.and.returnValue(utils.getPromise(q, allPivotTables));
                pivotTableRepository.getPivotTablesForNotifications().then(function (pivotTables) {
                    expect(pivotTables).toEqual(_.first(allPivotTables));
                });
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
                    id: 'somePivotTableId'
                };

                mockStore.find.and.returnValue(utils.getPromise(q, mockPivotTableData));
                PivotTableData.create.and.returnValue(mockPivotTableDataModel);
            });

            it('should get the pivotTableData for the specified pivotTable and orgUnit', function () {
                pivotTableRepository.getPivotTableData(pivotTableDefinition, orgUnitId).then(function (pivotTableData) {
                    expect(pivotTableData).toEqual(mockPivotTableDataModel);
                });

                scope.$apply();
                expect(mockStore.find).toHaveBeenCalledWith([pivotTableDefinition.id, orgUnitId]);
                expect(PivotTableData.create).toHaveBeenCalledWith(pivotTableDefinition, mockPivotTableData.data, undefined);
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
