define(["lodash"], function(_) {
    return function(db) {
        var pivotTableObjectStoreName = "pivotTables";
        var pivotTableDataObjectStoreName = "pivotTableData";

        this.replaceAll = function(pivotTables) {
            var store = db.objectStore(pivotTableObjectStoreName);
            return store.clear().then(function() {
                return store.upsert(pivotTables);
            });
        };

        this.upsertPivotTableData = function(pivotTableName, moduleId, data) {
            var store = db.objectStore(pivotTableDataObjectStoreName);
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

        this.getAll = function(pivotTables) {
            var store = db.objectStore(pivotTableObjectStoreName);
            return store.getAll().then(addSortVars);
        };

        this.getDataForPivotTable = function(pivotTableName, orgUnitId) {
            var query = db.queryBuilder().$eq(pivotTableName).$index("by_pivot_table").compile();
            var store = db.objectStore(pivotTableDataObjectStoreName);

            return store.each(query).then(function(data) {
                var output = _(data).filter({
                    orgUnit: orgUnitId
                }).map('data').first();
                return output;
            });
        };
    };
});
