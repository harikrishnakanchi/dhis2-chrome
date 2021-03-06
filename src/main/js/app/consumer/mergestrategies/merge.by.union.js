define(["lodashUtils", "moment"], function(_, moment) {
    return function(fieldToMerge, groupByField, remoteList, localList, logger) {
        var isMergeRequired = function(remoteItem, localItem) {
            return !_.isEmpty(localItem) && !_.isEmpty(_.xorBy(remoteItem[fieldToMerge], localItem[fieldToMerge], "id"));
        };

        var mergeFields = function(remoteItem, localItem) {
            var mergedField = _.unionBy([remoteItem[fieldToMerge], localItem[fieldToMerge]], "id");
            mergedField = _.sortBy(mergedField, "id");
            return mergedField;
        };

        var groupedLocalItems = _.indexBy(localList, groupByField);

        return _.transform(remoteList, function(acc, remoteItem) {
            var localItem = groupedLocalItems[remoteItem[groupByField]];
            if (isMergeRequired(remoteItem, localItem)) {
                var mergedItem = _.cloneDeep(remoteItem);
                logger.info("Merging " + fieldToMerge + " from localItem and remoteItem", localItem, remoteItem);
                mergedItem[fieldToMerge] = mergeFields(remoteItem, localItem);
                acc.push(mergedItem);
            } else {
                acc.push(remoteItem);
            }
        });
    };
});