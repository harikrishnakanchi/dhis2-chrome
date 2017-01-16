define(['lodash'], function (_) {
    // TODO: [#2144] remove 'FieldApp' from regular expression and decrement the indices if capture group is removed.
    var FIELD_APP_SERVICE_CODE_REGEX = /\[(Praxis|FieldApp) - (.*)]/;
    var FIELD_APP_TITLE_REGEX = /^\[(Praxis|FieldApp) - ([a-zA-Z0-9()><]+)\]([0-9\s]*)([a-zA-Z0-9-\s)><(&\/\\=%\+']+)/;

    var SERVICE_CODE_INDEX = 2,
        DISPLAY_POSITION_INDEX = 3,
        TITLE_INDEX = 4;

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
        this.referralLocationReport = this.serviceCode == 'ReferralLocation';
        this.opUnitReport = this.serviceCode == 'OpUnitReport';
        this.monthlyReport = isMonthlyReport(config.relativePeriods);
        this.weeklyReport = !this.monthlyReport;
        this.hideWeeks = hideWeeks(this.dataDimensionItems);

        this.title = parseTitle(this.name);
        this.displayPosition = parseDisplayPosition(this.name);
    };

    var parseTitle = function(pivotTableName) {
        var matches = FIELD_APP_TITLE_REGEX.exec(pivotTableName);
        return (matches && matches[TITLE_INDEX]) ? matches[TITLE_INDEX] : "";
    };

    var parseDisplayPosition = function(pivotTableName) {
        var matches = FIELD_APP_TITLE_REGEX.exec(pivotTableName);
        return (matches && matches[DISPLAY_POSITION_INDEX]) ? parseInt(matches[DISPLAY_POSITION_INDEX]) : null;
    };

    var isMonthlyReport = function (relativePeriods) {
        var selectedPeriod = _.findKey(relativePeriods, function(value) { return value; });
        return _.contains(selectedPeriod, "Month");
    };

    var parseServiceCode = function (pivotTableName) {
        var matches = FIELD_APP_SERVICE_CODE_REGEX.exec(pivotTableName);
        return matches && matches[SERVICE_CODE_INDEX];
    };

    var hideWeeks = function (dataDimensionItems) {
        return _.any(dataDimensionItems, function (dataDimensionItem) {
            if (dataDimensionItem.indicator && dataDimensionItem.indicator.numerator) {
                return dataDimensionItem.indicator.numerator.includes('I{');
            }
            if (dataDimensionItem.indicator && dataDimensionItem.indicator.denominator) {
                return dataDimensionItem.indicator.denominator.includes('I{');
            }
            if (dataDimensionItem.programIndicator) {
                return true;
            }
            return false;
        });
    };

    PivotTable.create = function () {
        var pivotTable = Object.create(PivotTable.prototype);
        PivotTable.apply(pivotTable, arguments);
        return pivotTable;
    };

    return PivotTable;
});