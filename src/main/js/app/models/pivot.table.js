define(['lodash'], function (_) {
    var FIELD_APP_DATASET_CODE_REGEX = /\[FieldApp - (.*)]/;
    var FIELD_APP_TITLE_REGEX = /^\[FieldApp - ([a-zA-Z0-9()><]+)\]([0-9\s]*)([a-zA-Z0-9-\s]+)/;

    var PivotTable = function (config) {
        this.id = config.id;
        this.name = config.name;
        this.columns = config.columns;
        this.rows = config.rows;
        this.filters = config.filters;

        this.sortAscending = config.sortOrder == 1;
        this.sortDescending = config.sortOrder == 2;
        this.sortable = this.sortAscending || this.sortDescending;

        this.dataSetCode = parseDatasetCode(this.name);
        this.projectReport = this.dataSetCode == 'ProjectReport';
        this.monthlyReport = isMonthlyReport(config.relativePeriods);

        this.title = parseTitle(this.name);
    };

    var parseTitle = function(pivotTableName) {
        var matches = FIELD_APP_TITLE_REGEX.exec(pivotTableName);
        return (matches && matches[3]) ? matches[3] : "";
    };

    var isMonthlyReport = function (relativePeriods) {
        var selectedPeriod = _.findKey(relativePeriods, function(value) { return value; });
        return _.contains(selectedPeriod, "Month");
    };

    var parseDatasetCode = function (pivotTableName) {
        var matches = FIELD_APP_DATASET_CODE_REGEX.exec(pivotTableName);
        return matches && matches[1];
    };

    return PivotTable;
});