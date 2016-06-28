define(["lodash", "pivotTable"], function(_, PivotTableModel) {
    return function(db, $q) {
        var PIVOT_TABLE_STORE_NAME = 'pivotTables';
        var PIVOT_TABLE_DATA_STORE_NAME = 'pivotTableData';

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

        this.getAll = function() {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);
            return store.getAll().then(function(pivotTableConfigs) {
                return _.map(pivotTableConfigs, PivotTableModel.create);
            });
        };

        this.getDataForPivotTable = function(pivotTableName, orgUnitId) {
            var store = db.objectStore(PIVOT_TABLE_DATA_STORE_NAME);
            return store.find([pivotTableName, orgUnitId]).then(function (pivotTableData) {
                return !!pivotTableData && pivotTableData.data;
            });
        };
    };
});
