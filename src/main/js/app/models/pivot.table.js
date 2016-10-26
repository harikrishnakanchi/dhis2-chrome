define(['lodash'], function (_) {
    var FIELD_APP_SERVICE_CODE_REGEX = /\[FieldApp - (.*)]/;
    var FIELD_APP_TITLE_REGEX = /^\[FieldApp - ([a-zA-Z0-9()><]+)\]([0-9\s]*)([a-zA-Z0-9-\s)><(&\/\\=%\+']+)/;

    var PivotTable = function (config) {
        this.id = config.id;
        this.name = config.name;
        this.columns = config.columns;
        this.rows = config.rows;
        this.filters = config.filters;
        this.categoryDimensions = config.categoryDimensions;
        this.dataDimensionItems = config.dataDimensionItems;

        this.sortAscending = config.sortOrder == 1;
        this.sortDescending = config.sortOrder == 2;
        this.sortable = this.sortAscending || this.sortDescending;

        this.serviceCode = parseServiceCode(this.name);
        this.projectReport = this.serviceCode == 'ProjectReport';
        this.geographicOriginReport = this.serviceCode == 'GeographicOrigin';
        this.monthlyReport = isMonthlyReport(config.relativePeriods);
        this.weeklyReport = !this.monthlyReport;

        this.title = parseTitle(this.name);
        this.displayPosition = parseDisplayPosition(this.name);
    };

    var parseTitle = function(pivotTableName) {
        var matches = FIELD_APP_TITLE_REGEX.exec(pivotTableName);
        return (matches && matches[3]) ? matches[3] : "";
    };

    var parseDisplayPosition = function(pivotTableName) {
        var matches = FIELD_APP_TITLE_REGEX.exec(pivotTableName);
        return (matches && matches[2]) ? parseInt(matches[2]) : null;
    };

    var isMonthlyReport = function (relativePeriods) {
        var selectedPeriod = _.findKey(relativePeriods, function(value) { return value; });
        return _.contains(selectedPeriod, "Month");
    };

    var parseServiceCode = function (pivotTableName) {
        var matches = FIELD_APP_SERVICE_CODE_REGEX.exec(pivotTableName);
        return matches && matches[1];
    };

    PivotTable.create = function () {
        var pivotTable = Object.create(PivotTable.prototype);
        PivotTable.apply(pivotTable, arguments);
        return pivotTable;
    };

    return PivotTable;
});