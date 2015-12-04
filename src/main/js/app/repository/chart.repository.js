define(["lodash"], function(_) {
    return function(db,$q) {
        this.upsert = function(charts) {
            var store = db.objectStore("charts");
            return store.upsert(charts);
        };

        this.upsertChartData = function(chartName, moduleId, data) {
            var store = db.objectStore("chartData");
            var chartDataItem = {
                chart: chartName,
                orgUnit: moduleId,
                data: data
            };
            return store.upsert(chartDataItem);
        };

        this.getAllChartsForNotifications = function() {
            var store = db.objectStore("charts");
            return store.getAll().then(function(charts) {
                return _.filter(charts, function(chart) {
                    return _.endsWith(chart.name, "Notifications");
                });
            });
        };

        this.deleteMultipleChartsById = function(idsToDelete,charts) {
            var store = db.objectStore("charts");
            return $q.all(_.map(idsToDelete,function(id){
                chartToDelete = _.find(charts,{"id":id});
                return store.delete(chartToDelete.name);
            }));
        };

        this.getAll = function() {
            var store = db.objectStore("charts");
            return store.getAll();
        };

        this.getDataForChart = function(chartName, orgUnitId) {
            var query = db.queryBuilder().$eq(chartName).$index("by_chart").compile();
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
