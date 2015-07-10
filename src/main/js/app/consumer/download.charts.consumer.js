define([], function() {
    return function(chartService, chartRepository) {
        this.run = function(message) {
            var saveCharts = function(response) {
            	chartRepository.upsert(response.data.charts);
            };
            chartService.getAllFieldAppCharts().then(saveCharts);
        };
    };
});
