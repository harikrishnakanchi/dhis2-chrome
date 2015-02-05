define(["lodashUtils", "moment"], function(_, moment) {
    return function(fieldToMerge, remoteData, localData) {
        var isDhisDataNewer = function() {
            return moment(remoteData.lastUpdated).isAfter(moment(localData.lastUpdated));
        };

        var areFieldsDifferent = function() {
            return !_.isEmpty(_.xorBy(remoteData[fieldToMerge], localData[fieldToMerge], "id"));
        };

        var isLocalDataStale = function() {
            return isDhisDataNewer() || areFieldsDifferent();
        };

        var mergeFields = function() {
            var mergedField = _.unionBy([remoteData[fieldToMerge], localData[fieldToMerge]], "id");
            mergedField = _.sortBy(mergedField, "id");
            return mergedField;
        };

        if (!localData) {
            return remoteData;
        }

        if (!isLocalDataStale(remoteData, localData)) {
            return;
        }

        var mergedData = _.cloneDeep(remoteData);
        mergedData[fieldToMerge] = mergeFields();
        return mergedData;
    };
});
