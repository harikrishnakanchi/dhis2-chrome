define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(dataService, dataRepository, dataSetRepository, userPreferenceRepository, $q, approvalService) {
        var getAllDataValues = function(vals) {
            var orgUnitIds = vals[0];
            var allDataSets = vals[1];
            return $q.when(orgUnitIds.length > 0 && allDataSets.length > 0 ? dataService.downloadAllData(orgUnitIds, allDataSets) : []);
        };

        var getUserOrgUnits = function() {
            return userPreferenceRepository.getAll().then(function(userPreferences) {
                userPreferences = userPreferences || [];
                return _.map(_.flatten(_.map(userPreferences, "orgUnits")), function(o) {
                    return o.id;
                });
            });
        };

        var downloadData = function() {
            var downloadApprovalData = function(metadata) {
                var userOrgUnitIds = metadata[0];
                var allDataSets = _.pluck(metadata[1], "id");

                if (userOrgUnitIds.length === 0) return;

                var saveAllLevelOneApprovalData = function(data) {
                    console.debug("Storing approval data");
                    return approvalService.saveLevelOneApprovalData(data);
                };

                return approvalService.getAllLevelOneApprovalData(userOrgUnitIds, allDataSets).then(saveAllLevelOneApprovalData);
            };

            var downloadDataValues = function(metadata) {
                var getPeriod = function(m) {
                    return m.year() + "W" + m.isoWeek();
                };

                var dataValuesEquals = function(d1, d2) {
                    return d1.dataElement === d2.dataElement && d1.period === d2.period && d1.orgUnit === d2.orgUnit && d1.categoryOptionCombo === d2.categoryOptionCombo;
                };

                var saveAllDataValues = function(data) {
                    var dataValuesFromDhis = data.dataValues;
                    var userOrgUnitIds = metadata[0];
                    var startPeriod = getPeriod(moment());
                    var endPeriod = getPeriod(moment().isoWeek(properties.projectDataSync.numWeeksToSync));
                    return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, userOrgUnitIds).then(function(dataValuesFromDb) {
                        var mergedData = merge(_.flatten(dataValuesFromDb, "dataValues"), dataValuesFromDhis, dataValuesEquals);
                        return dataRepository.save({
                            "dataValues": mergedData
                        });
                    });
                };

                return getAllDataValues(metadata).then(saveAllDataValues);
            };

            return $q.all([getUserOrgUnits(), dataSetRepository.getAll()]).then(function(metadata) {
                return $q.all([downloadDataValues(metadata), downloadApprovalData(metadata)]);
            });
        };

        var merge = function(list1, list2, equalsPred) {
            equalsPred = _.curry(equalsPred);
            return _.transform(list2, function(acc, ele) {
                var resultIndex = _.findIndex(acc, equalsPred(ele));
                if (resultIndex >= 0) {
                    if (ele.lastUpdated > acc[resultIndex].lastUpdated) {
                        acc[resultIndex] = ele;
                    }
                } else {
                    acc.push(ele);
                }
            }, list1);
        };

        var uploadDataValues = function(dataToUpload) {
            var preparePayload = function() {
                var dataValues = dataToUpload.dataValues[0];
                return dataRepository.getDataValues(dataValues.period, dataValues.orgUnit).then(function(data) {
                    return data;
                });
            };

            var uploadData = function(data) {
                return dataService.save(data);
            };

            return downloadData().then(preparePayload).then(uploadData);
        };

        var uploadApprovalData = function(data) {
            console.debug("Uploading approval data");
            return approvalService.markAsComplete(data.dataSets, data.period, data.orgUnit, data.storedBy, data.date);
        };

        this.run = function(message) {
            var payload = message.data;
            var action = {
                "uploadDataValues": uploadDataValues,
                "downloadData": downloadData,
                "uploadApprovalData": uploadApprovalData
            };
            return action[payload.type](payload.data);
        };
    };
});