define(['moment', 'lodashUtils'], function(moment, _) {
    return function(datasetService, systemInfoService, datasetRepository, $q, changeLogRepository, mergeBy) {
        this.run = function(message) {
            return getServerTime()
                .then(download)
                .then(mergeAndSave)
                .then(updateChangeLog);
        };

        var getServerTime = function () {
            return systemInfoService.getServerDate()
                .then(function (serverDate) {
                    return {
                        downloadStartTime: serverDate
                    };
                });
        };

        var download = function (data) {
            return changeLogRepository.get("datasets")
                .then(datasetService.getAll)
                .then(function (dataSets) {
                    return _.merge({dataSets: dataSets}, data);
                });
        };

        var mergeAndSave = function(data) {
            var dataSetIds = _.pluck(data.dataSets, "id");
            return datasetRepository.findAllDhisDatasets(dataSetIds)
                .then(_.curry(mergeBy.union)("organisationUnits", "id", data.dataSets))
                .then(datasetRepository.upsertDhisDownloadedData)
                .then(function () {
                    return data;
                });
        };

        var updateChangeLog = function(data) {
            return changeLogRepository.upsert("datasets", data.downloadStartTime);
        };
    };
});
