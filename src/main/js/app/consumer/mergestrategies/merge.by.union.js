define(["lodashUtils", "moment"], function(_, moment) {
    return function(fieldToMerge, remoteList, localList) {
        var isLocalDataStale = function(remoteItem, localItem) {
            if (!localItem)
                return true;

            return !_.isEmpty(_.xorBy(remoteItem[fieldToMerge], localItem[fieldToMerge], "id"));
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
            if (isLocalDataStale(remoteItem, groupedLocalItems[remoteItem.id])) {
                var mergedItem = _.cloneDeep(remoteItem);
                mergedItem[fieldToMerge] = mergeFields(remoteItem, groupedLocalItems[remoteItem.id]);
                acc.push(mergedItem);
            } else
                acc.push(groupedLocalItems[remoteItem.id]);
        });
    };
});
