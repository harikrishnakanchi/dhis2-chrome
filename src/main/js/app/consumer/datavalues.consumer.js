define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function(dataService, dataRepository, dataSetRepository, userPreferenceRepository, $q, approvalService, approvalDataRepository) {

        var downloadData = function() {
            var getPeriod = function(m) {
                return m.year() + "W" + m.isoWeek();
            };

            var getUserOrgUnits = function() {
                return userPreferenceRepository.getAll().then(function(userPreferences) {
                    userPreferences = userPreferences || [];
                    return _.map(_.flatten(_.map(userPreferences, "orgUnits")), function(o) {
                        return o.id;
                    });
                });
            };

            var merge = function(list1, list2, equalsPred, lastUpdateDateProperty) {
                lastUpdateDateProperty = lastUpdateDateProperty || "lastUpdated";
                equalsPred = _.curry(equalsPred);
                return _.transform(list2, function(acc, ele) {
                    var resultIndex = _.findIndex(acc, equalsPred(ele));
                    if (resultIndex >= 0) {
                        if (ele[lastUpdateDateProperty] > acc[resultIndex][lastUpdateDateProperty]) {
                            acc[resultIndex] = ele;
                        }
                    } else {
                        acc.push(ele);
                    }
                }, list1);
            };

            var downloadCompletionData = function(metadata) {
                var userOrgUnitIds = metadata[0];
                var allDataSets = _.pluck(metadata[1], "id");

                if (userOrgUnitIds.length === 0 || allDataSets.length === 0) return;

                var saveAllLevelOneApprovalData = function(dhisApprovalData) {

                    if (_.isEmpty(dhisApprovalData))
                        return;

                    var m = moment();
                    var startPeriod = getPeriod(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                    var endPeriod = getPeriod(moment());

                    var moduleIds = _.unique(_.pluck(dhisApprovalData, "orgUnit"));

                    var equalsPred = function(obj1, obj2) {
                        return obj1.period === obj2.period && obj1.orgUnit === obj2.orgUnit;
                    };

                    approvalDataRepository.getLevelOneApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(function(dbApprovalData) {
                        var mergedData = merge(dhisApprovalData, dbApprovalData, equalsPred, "date");
                        return approvalDataRepository.saveLevelOneApproval(mergedData);
                    });
                };

                return approvalService.getAllLevelOneApprovalData(userOrgUnitIds, allDataSets).then(saveAllLevelOneApprovalData);
            };

            var downloadDataValues = function(metadata) {
                var dataValuesEquals = function(d1, d2) {
                    return d1.dataElement === d2.dataElement && d1.period === d2.period && d1.orgUnit === d2.orgUnit && d1.categoryOptionCombo === d2.categoryOptionCombo;
                };

                var getAllDataValues = function(vals) {
                    var orgUnitIds = vals[0];
                    var allDataSets = vals[1];
                    return $q.when(orgUnitIds.length > 0 && allDataSets.length > 0 ? dataService.downloadAllData(orgUnitIds, allDataSets) : []);
                };

                var clearApprovals = function(mergedData, originalData) {
                    var orgUnitAndPeriod = function(dataValue) {
                        return dataValue.orgUnit + dataValue.period;
                    };

                    var groupedMergedData = _.groupBy(mergedData, orgUnitAndPeriod);
                    var groupedOriginalData = _.groupBy(originalData, orgUnitAndPeriod);

                    var deleteApprovals = [];
                    for (var data in groupedOriginalData) {
                        if (groupedMergedData[data] && !_.isEqual(groupedMergedData[data], groupedOriginalData[data])) {
                            var firstDataValue = groupedOriginalData[data][0];
                            var deleteApproval = approvalDataRepository.deleteLevelOneApproval(firstDataValue.period, firstDataValue.orgUnit);
                            deleteApprovals.push(deleteApproval);
                        }
                    }

                    return $q.all(deleteApprovals);
                };

                var saveAllDataValues = function(data) {
                    if (_.isEmpty(data))
                        return;

                    var dataValuesFromDhis = data.dataValues;

                    var m = moment();
                    var startPeriod = getPeriod(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                    var endPeriod = getPeriod(moment());

                    var moduleIds = _.unique(_.pluck(dataValuesFromDhis, "orgUnit"));

                    return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, moduleIds).then(function(dataValuesFromDb) {
                        var mergedData = merge(_.flatten(dataValuesFromDb, "dataValues"), dataValuesFromDhis, dataValuesEquals);
                        return clearApprovals(mergedData, dataValuesFromDb).then(function() {
                            return dataRepository.save({
                                "dataValues": mergedData
                            });
                        });
                    });
                };

                return getAllDataValues(metadata).then(saveAllDataValues);
            };

            return $q.all([getUserOrgUnits(), dataSetRepository.getAll()]).then(function(metadata) {
                return $q.all([downloadDataValues(metadata), downloadCompletionData(metadata)]);
            });
        };

        var processDownloadMessage = function() {
            downloadData();
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

        var uploadCompletionData = function(data) {
            var preparePayload = function() {
                return approvalDataRepository.getLevelOneApprovalData(data.period, data.orgUnit);
            };

            var upload = function(payload) {
                if (payload.status === "NEW")
                    return approvalService.markAsComplete(payload.dataSets, payload.period, payload.orgUnit, payload.storedBy, payload.date);
                if (payload.status === "DELETED")
                    return approvalService.markAsIncomplete(payload.dataSets, payload.period, payload.orgUnit);
            };

            return downloadData().then(preparePayload).then(upload);
        };

        var uploadApprovalData = function(data) {
            var preparePayload = function() {
                return approvalDataRepository.getLevelTwoApprovalData(data.period, data.orgUnit);
            };

            var upload = function(payload) {
                return approvalService.markAsApproved(payload.dataSets, payload.period, payload.orgUnit);
            };

            return downloadData().then(preparePayload).then(upload);
        };

        this.run = function(message) {
            var payload = message.data;
            var action = {
                "uploadDataValues": uploadDataValues,
                "downloadData": processDownloadMessage,
                "uploadCompletionData": uploadCompletionData,
                "uploadApprovalData": uploadApprovalData
            };
            return action[payload.type](payload.data);
        };
    };
});