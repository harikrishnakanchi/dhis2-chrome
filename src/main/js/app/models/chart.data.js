define(['analyticsData', 'lodash'], function (AnalyticsData, _) {

    var ChartData = function(definition, data) {
        this.id = definition.id;
        this.title = definition.title;
        this.type = definition.type;
        this.serviceCode = definition.serviceCode;
        this.displayPosition = definition.displayPosition;
        this.weeklyChart = definition.weeklyChart;
        this.monthlyChart = definition.monthlyChart;
        this.yearlyChart = definition.yearlyChart;

        var analyticsData = AnalyticsData.create(definition, data);

        this.categories = _.first(analyticsData.rows);
        this.series = _.first(analyticsData.columns);
        this.isDataAvailable = analyticsData.isDataAvailable;
        this.getDataValue = analyticsData.getDataValue;
        this.getDisplayName = analyticsData.getDisplayName;
    };

    ChartData.create = function () {
        var chartData = Object.create(ChartData.prototype);
        ChartData.apply(chartData, arguments);
        return chartData;
    };

    return ChartData;
});