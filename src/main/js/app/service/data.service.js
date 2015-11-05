define(["lodash", "moment", "dhisUrl", "properties"], function(_, moment, dhisUrl, properties) {
    return function($http, $q) {
        this.downloadAllData = function(orgUnitIds, dataSetIds, startDate, lastUpdated) {
            var getPeriods = function(startDate) {
                var numOfWeeks = moment().diff(moment(startDate), 'weeks');
                var periods = [];
                while (numOfWeeks > 0) {
                    periods.push(moment(startDate).add(numOfWeeks, 'weeks').format("GGGG[W]WW"));
                    numOfWeeks = numOfWeeks - 1;
                }
                return periods;
            };

            var fillData = function(dataFromDhis, periods) {
                if (_.isEmpty(periods))
                    return $q.when(dataFromDhis);

                return $http.get(dhisUrl.dataValueSets, {
                    "params": {
                        "orgUnit": orgUnitIds,
                        "children": true,
                        "dataSet": dataSetIds,
                        "period": periods.pop(),
                        "lastUpdated": lastUpdated
                    }
                }).then(function(result) {
                    if (!_.isEmpty(result.data)) {
                        _.each(result.data.dataValues, function(dataValue) {
                            dataValue.period = moment(dataValue.period, "GGGG[W]W").format("GGGG[W]WW");
                            dataFromDhis.push(dataValue);
                        });
                    }
                    return fillData(dataFromDhis, periods);
                }, function() {
                    return $q.reject({});
                });
            };

            var periods = getPeriods(startDate);
            var dataFromDhis = [];
            return fillData(dataFromDhis, periods);
        };

        this.save = function(dataValues) {

            var sucessResponse = function(response) {
                if (response.data.status === "ERROR") {
                    return $q.reject(response);
                }
                return response;
            };

            var errorResponse = function(response) {
                return $q.reject(response);
            };

            var payload = {
                "dataValues": dataValues
            };
            return $http.post(dhisUrl.dataValueSets, payload).then(sucessResponse, errorResponse);
        };
    };
});
