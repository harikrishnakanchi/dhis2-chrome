define(["lodash"], function(_) {
    return function(db) {
        this.upsert = function(charts) {
            var store = db.objectStore("charts");
            return store.upsert(charts);
        };

        this.upsertChartData = function(chart, orgUnit, data) {
            var store = db.objectStore("chartData");
            var chartDataItem = {
                chart: chart.id,
                orgUnit: orgUnit.id,
                data: data
            };
            return store.upsert(chartDataItem);
        };
        
        this.getAll = function(charts) {
            var store = db.objectStore("charts");
            return store.getAll();
        };

        this.getDataForChart = function(chart, orgUnitId) {
            var query = db.queryBuilder().$eq(chart.id).$index("by_chart").compile();
            var store = db.objectStore('chartData');

            return store.each(query).then(function(data) {
                var output = _(data).filter({
                    orgUnit: orgUnitId
                }).map('data').first();
                return output;
            });
        };
    };
});