define([], function() {
    var FIELD_APP_NAME_REGEX = /^\[Praxis - ([a-zA-Z0-9()><]+)\]([0-9\s]*)([a-zA-Z0-9-\s]+)/;

    var SERVICE_CODE_INDEX = 1,
        DISPLAY_POSITION_INDEX = 2;

    var Chart = function(config) {
        this.id = config.id;
        this.name = config.name;
        this.title = config.title;
        this.translations = config.translations;
        this.columns = config.columns;
        this.filters = config.filters;
        this.rows = config.rows;
        this.type = config.type;
        this.categoryDimensions = config.categoryDimensions;
        this.dataDimensionItems = config.dataDimensionItems;

        this.serviceCode = parseServiceCode(this.name);
        this.displayPosition = parseDisplayPosition(this.name);

        this.geographicOriginChart = this.serviceCode == 'GeographicOrigin';
        this.monthlyChart = isChartOfType(config.relativePeriods, "Month");
        this.weeklyChart = isChartOfType(config.relativePeriods, "Week");
        this.yearlyChart = !(this.monthlyChart || this.weeklyChart);
    };

    var parseServiceCode = function(chartName) {
        var matches = FIELD_APP_NAME_REGEX.exec(chartName);
        return matches && matches[SERVICE_CODE_INDEX];
    };

    var parseDisplayPosition = function(chartName) {
        var matches = FIELD_APP_NAME_REGEX.exec(chartName);
        return matches && parseInt(matches[DISPLAY_POSITION_INDEX]);
    };

    var isChartOfType = function (relativePeriods, typeOfReport) {
        var selectedPeriod = _.findKey(relativePeriods, function(value) { return value; });
        return _.contains(selectedPeriod, typeOfReport);
    };

    Chart.create = function () {
        var chart = Object.create(Chart.prototype);
        Chart.apply(chart, arguments);
        return chart;
    };

    return Chart;
});