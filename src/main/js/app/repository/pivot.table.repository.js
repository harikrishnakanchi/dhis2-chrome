define(["lodash"], function(_) {
    return function(db, $q) {
        var PIVOT_TABLE_STORE_NAME = 'pivotTables';
        var PIVOT_TABLE_DATA_STORE_NAME = 'pivotTableData';
        var FIELD_APP_DATASET_CODE_REGEX = /\[FieldApp - (.*)]/;

        this.upsert = function(pivotTables) {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);
            return store.upsert(pivotTables);
        };

        this.deleteByIds = function(idsToDelete, pivotTables) {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);
            return $q.all(_.map(idsToDelete, function(id) {
                var pivotTableToDelete = _.find(pivotTables, {
                    'id': id
                });
                return store.delete(pivotTableToDelete.name);
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

        var addSortVars = function(pivotTables) {
            _.each(pivotTables,function(eachPivotTable){
                eachPivotTable.sortAscending = eachPivotTable.sortOrder == 1;
                eachPivotTable.sortDescending = eachPivotTable.sortOrder == 2;
                eachPivotTable.sortable = eachPivotTable.sortAscending || eachPivotTable.sortDescending;
            });
            return pivotTables;
        };

        var parseDataSetCodes = function(pivotTables) {
            return _.map(pivotTables, function(pivotTable) {
                var matches = FIELD_APP_DATASET_CODE_REGEX.exec(pivotTable.name);
                pivotTable.dataSetCode = matches && matches[1];
                return pivotTable;
            });
        };

        this.getAll = function(pivotTables) {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);
            return store.getAll().then(addSortVars).then(parseDataSetCodes);
        };

        this.getDataForPivotTable = function(pivotTableName, orgUnitId) {
            var query = db.queryBuilder().$eq(pivotTableName).$index("by_pivot_table").compile();
            var store = db.objectStore(PIVOT_TABLE_DATA_STORE_NAME);

            return store.each(query).then(function(data) {
                var output = _(data).filter({
                    orgUnit: orgUnitId
                }).map('data').first();
                return output;
            });
        };
    };
});
