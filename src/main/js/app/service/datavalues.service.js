define(["lodash", "moment"], function(_, moment) {
    return function(dataService, dataRepository, dataSetRepository, userPreferenceRepository, $q) {
        this.sync = function(dataToUpload) {
            var dataValues = [];
            var getAllDataValues = function(vals) {
                var orgUnitIds = vals[0];
                var allDataSets = vals[1];
                return orgUnitIds.length > 0 && allDataSets.length > 0 ? dataService.downloadAllData(orgUnitIds, allDataSets) : [];
            };

            var hasConflict = function(dataToUpload, downloadedData) {
                var isBefore = function(date1, date2) {
                    var d1 = moment(date1);
                    var d2 = moment(date2);
                    return d1.isBefore(d2);
                };

                return _.any(dataToUpload, function(udv) {
                    return _.any(downloadedData, function(ddv) {
                        return udv.dataElement === ddv.dataElement &&
                            udv.period === ddv.period &&
                            udv.orgUnit === ddv.orgUnit &&
                            udv.categoryOptionCombo === ddv.categoryOptionCombo &&
                            isBefore(udv.lastUpdated, ddv.lastUpdated);
                    });
                });
            };

            var merge = function(dataToUpload, downloadedData) {
                var concatenatedDataValues = dataToUpload.dataValues.concat(downloadedData.dataValues);
                var dataValuesUnion = _.transform(concatenatedDataValues, function(acc, dv) {
                    var alreadyPresent = _.any(acc, {
                        "dataElement": dv.dataElement,
                        "period": dv.period,
                        "orgUnit": dv.orgUnit,
                        "categoryOptionCombo": dv.categoryOptionCombo
                    });
                    if (!alreadyPresent) {
                        acc.push(dv);
                    }
                }, []);
                return {
                    "dataValues": dataValuesUnion
                };
            };

            var saveAllDataValues = function(data) {
                console.debug("Storing data values : ", data);
                if (dataToUpload && hasConflict(dataToUpload.dataValues, data.dataValues)) {
                    console.debug("Conflicting data values : ", data, dataToUpload);
                    dataRepository.save(data);
                    return $q.reject("");
                } else if (dataToUpload) {
                    data = merge(dataToUpload, data);
                }
                return dataRepository.save(data);
            };

            var getAllOrgUnits = function() {
                return userPreferenceRepository.getAll().then(function(userPreferences) {
                    userPreferences = userPreferences || [];
                    return _.map(_.flatten(_.map(userPreferences, "orgUnits")), function(o) {
                        return o.id;
                    });
                });
            };

            var uploadData = function() {
                if (dataToUpload) dataService.save(dataToUpload);
            };

            return $q.all([getAllOrgUnits(), dataSetRepository.getAll()]).then(getAllDataValues).then(saveAllDataValues).then(uploadData);
        };
    };
});