define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(dataService, dataRepository) {
        var preparePayload = function(dataValues) {
            var period = moment(dataValues[0].period, 'GGGG[W]W').format('GGGG[W]WW');
            var orgUnit = dataValues[0].orgUnit;
            return dataRepository.getDataValues(period, orgUnit);
        };

        var uploadData = function(data) {
            return dataService.save(data);
        };

        this.run = function(message) {
            return preparePayload(message.data.data).then(uploadData);
        };
    };
});
