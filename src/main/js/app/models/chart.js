define([], function() {
    var FIELD_APP_NAME_REGEX = /^\[FieldApp - ([a-zA-Z0-9()><]+)\]([0-9\s]*)([a-zA-Z0-9-\s]+)/;

    var Chart = function(config) {
        this.id = config.id;
        this.name = config.name;
        this.title = config.title;
        this.columns = config.columns;
        this.filters = config.filters;
        this.rows = config.rows;
        this.type = config.type;
        this.categoryDimensions = config.categoryDimensions;
        this.dataDimensionItems = config.dataDimensionItems;

        this.serviceCode = parseServiceCode(this.name);
        this.displayPosition = parseDisplayPosition(this.name);

        this.geographicOriginChart = this.serviceCode == 'GeographicOrigin';
        this.monthlyChart = isMonthlyChart(config.relativePeriods);
        this.weeklyChart = !this.monthlyChart;
    };

    var parseServiceCode = function(chartName) {
        var matches = FIELD_APP_NAME_REGEX.exec(chartName);
        return matches && matches[1];
    };

    var parseDisplayPosition = function(chartName) {
        var matches = FIELD_APP_NAME_REGEX.exec(chartName);
        return matches && parseInt(matches[2]);
    };

    var isMonthlyChart = function(relativePeriods) {
        var selectedPeriod = _.findKey(relativePeriods, function(value) { return value; });
        return _.contains(selectedPeriod, "Month");
    };

    Chart.create = function () {
        var chart = Object.create(Chart.prototype);
        Chart.apply(chart, arguments);
        return chart;
    };

    return Chart;
});