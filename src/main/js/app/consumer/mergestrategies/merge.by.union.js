define(["lodashUtils", "moment"], function(_, moment) {
    return function(fieldToMerge, remoteList, localList) {
        var isLocalDataStale = function(remoteItem, localItem) {
            return localItem && !_.isEmpty(_.xorBy(remoteItem[fieldToMerge], localItem[fieldToMerge], "id"));
        };

        var mergeFields = function(remoteItem, localItem) {
            if (!localItem)
                return remoteItem[fieldToMerge];

            var mergedField = _.unionBy([remoteItem[fieldToMerge], localItem[fieldToMerge]], "id");
            mergedField = _.sortBy(mergedField, "id");
            return mergedField;
        };

        var groupedLocalItems = _.indexBy(localList, "id");

        return _.transform(remoteList, function(acc, remoteItem) {
            var localItem = groupedLocalItems[remoteItem.id];
            if (isLocalDataStale(remoteItem, localItem)) {
                var mergedItem = _.cloneDeep(remoteItem);
                mergedItem[fieldToMerge] = mergeFields(remoteItem, localItem);
                acc.push(mergedItem);
            } else {
                if (localItem)
                    acc.push(localItem);
            }
        });
    };
});
