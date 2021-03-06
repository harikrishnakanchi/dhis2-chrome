define(["lodash", "pivotTable", "pivotTableData"], function (_, PivotTableModel, PivotTableData) {
    return function (db, $q, categoryRepository, dataElementRepository, indicatorRepository, programIndicatorRepository) {
        var PIVOT_TABLE_STORE_NAME = 'pivotTableDefinitions';
        var PIVOT_TABLE_DATA_STORE_NAME = 'pivotTableData';

        this.upsert = function(pivotTables) {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);
            return store.upsert(pivotTables);
        };

        this.deleteByIds = function(idsToDelete) {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);
            return $q.all(_.map(idsToDelete, function(pivotTableId) {
                return store.delete(pivotTableId);
            }));
        };

        this.upsertPivotTableData = function(pivotTableId, moduleId, data) {
            var store = db.objectStore(PIVOT_TABLE_DATA_STORE_NAME);
            var pivotTableDataItem = {
                pivotTable: pivotTableId,
                orgUnit: moduleId,
                data: data
            };
            return store.upsert(pivotTableDataItem);
        };

        this.getAll = function () {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);

            return store.getAll().then(function (pivotTables) {
                var categoryDimensions = _.flatten(_.map(pivotTables, 'categoryDimensions')),
                    dataElements = _.compact(_.map(_.flatten(_.map(pivotTables, 'dataDimensionItems')), 'dataElement')),
                    indicators = _.compact(_.map(_.flatten(_.map(pivotTables, 'dataDimensionItems')), 'indicator')),
                    programIndicators = _.compact(_.map(_.flatten(_.map(pivotTables, 'dataDimensionItems')), 'programIndicator'));

                return $q.all([categoryRepository.enrichWithCategoryOptions(categoryDimensions),
                        dataElementRepository.enrichWithDataElementsDetails(dataElements),
                        indicatorRepository.enrichWithIndicatorDetails(indicators),
                        programIndicatorRepository.enrichWithProgramIndicatorDetails(programIndicators)])
                    .then(_.partial(_.map, pivotTables, PivotTableModel.create));
            });
        };

        this.getPivotTablesForNotifications = function () {
            return this.getAll().then(function (allPivotTables) {
                return _.filter(allPivotTables, function (pivotTable) {
                    return _.endsWith(pivotTable.name, 'Notifications');
                });
            });
        };

        this.getPivotTableData = function (pivotTableDefinition, orgUnitId, shouldNotExcludeEmptyDataValues) {
            var store = db.objectStore(PIVOT_TABLE_DATA_STORE_NAME);
            return store.find([pivotTableDefinition.id, orgUnitId]).then(function (pivotTableData) {
                return pivotTableData && PivotTableData.create(pivotTableDefinition, pivotTableData.data, shouldNotExcludeEmptyDataValues);
            });
        };
    };
});
