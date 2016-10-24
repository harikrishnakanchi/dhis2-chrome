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

        var enrichPivotTableConfigWithCategoryOptions = function (pivotTableConfig, categoryOptions) {
            pivotTableConfig.categoryDimensions = _.map(pivotTableConfig.categoryDimensions, function (categoryDimension) {
                categoryDimension.categoryOptions = _.map(categoryDimension.categoryOptions, function (categoryOption) {
                    return categoryOptions[categoryOption.id] || categoryOption;
                });
                return categoryDimension;
            });
            return pivotTableConfig;
        };

        this.getAll = function () {
            var store = db.objectStore(PIVOT_TABLE_STORE_NAME);
            return $q.all([store.getAll(), categoryRepository.getAllCategoryOptions()]).then(function (data) {
                var pivotTableConfigs = _.first(data);
                var allCategoryOptions = _.indexBy(_.last(data), 'id');
                var enrichPivotTableConfig = _.flowRight(PivotTableModel.create, _.partial(enrichPivotTableConfigWithCategoryOptions, _, allCategoryOptions));
                return _.map(pivotTableConfigs, enrichPivotTableConfig);
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
