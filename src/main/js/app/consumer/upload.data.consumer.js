define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(dataService, dataRepository) {
        var preparePayload = function(dataValues) {
            var period = moment(dataValues[0].period, 'GGGG[W]W').format('GGGG[W]WW');
            var orgUnits = _.uniq(_.pluck(dataValues, "orgUnit"));
            return dataRepository.getDataValues(period, orgUnits);
        };

        var uploadData = function(data) {
            return dataService.save(data);
        };

        this.run = function(message) {
            if (!_.isEmpty(message.data.data))
                return preparePayload(message.data.data).then(uploadData);
        };
    };
});
