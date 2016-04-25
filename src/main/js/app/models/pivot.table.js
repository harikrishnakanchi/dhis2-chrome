define([], function () {
    var FIELD_APP_DATASET_CODE_REGEX = /\[FieldApp - (.*)]/;

    var PivotTable = function (config) {
        this.id = config.id;
        this.name = config.name;

        this.sortAscending = config.sortOrder == 1;
        this.sortDescending = config.sortOrder == 2;
        this.sortable = this.sortAscending || this.sortDescending;

        this.dataSetCode = parseDatasetCode(this.name);
    };

    var parseDatasetCode = function (pivotTableName) {
        var matches = FIELD_APP_DATASET_CODE_REGEX.exec(pivotTableName);
        return matches && matches[1];
    };

    return PivotTable;
});