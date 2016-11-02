define(["lodash", "pivotTable", "pivotTableData"], function(_, PivotTableModel, PivotTableData) {
    return function(db, $q, categoryRepository) {
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

        this.upsertPivotTableData = function(pivotTableName, moduleId, data) {
            var store = db.objectStore(PIVOT_TABLE_DATA_STORE_NAME);
            var pivotTableDataItem = {
                pivotTable: pivotTableName,
                orgUnit: moduleId,
                data: data
            };
            return store.upsert(pivotTableDataItem);
        };

        this.getAll = function () {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);

            return store.getAll().then(function (pivotTables) {
                var categoryDimensions = _.flatten(_.map(pivotTables, 'categoryDimensions'));

                return categoryRepository.enrichWithCategoryOptions(categoryDimensions)
                    .then(_.partial(_.map, pivotTables, PivotTableModel.create));
            });
        };

        this.getPivotTableData = function (pivotTableDefinition, orgUnitId) {
            var store = db.objectStore(PIVOT_TABLE_DATA_STORE_NAME);
            return store.find([pivotTableDefinition.name, orgUnitId]).then(function (pivotTableData) {
                return pivotTableData && PivotTableData.create(pivotTableDefinition, pivotTableData.data);
            });
        };
    };
});
