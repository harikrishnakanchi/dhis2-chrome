define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(dataService, dataRepository) {
        var preparePayload = function(dataToUpload) {
            var dataValues = dataToUpload.dataValues[0];
            return dataRepository.getDataValues(dataValues.period, dataValues.orgUnit).then(function(data) {
                return data;
            });
        };

        var uploadData = function(data) {
            return dataService.save(data);
        };

        this.run = function(message) {
            return preparePayload(message.data.data).then(uploadData);
        };
    };
});