define(["lodashUtils", "moment"], function(_, moment) {
    return function(fieldToMerge, remoteData, localData) {
        var isLocalDataStale = function() {
            return !_.isEmpty(_.xorBy(remoteData[fieldToMerge], localData[fieldToMerge], "id"));
        };

        var mergeFields = function() {
            var mergedField = _.unionBy([remoteData[fieldToMerge], localData[fieldToMerge]], "id");
            mergedField = _.sortBy(mergedField, "id");
            return mergedField;
        };

        if (!localData) {
            return remoteData;
        }

        if (!isLocalDataStale()) {
            return;
        }

        var mergedData = _.cloneDeep(remoteData);
        mergedData[fieldToMerge] = mergeFields();
        return mergedData;
    };
});
