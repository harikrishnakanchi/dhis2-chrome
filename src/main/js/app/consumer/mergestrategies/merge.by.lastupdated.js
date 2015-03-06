define(["lodashUtils", "moment"], function(_, moment) {
    return function(equalsPred, remoteTimeField, localTimeField, remoteList, localList) {
        var epoc = "1970-01-01T00:00";
        remoteTimeField = remoteTimeField || "lastUpdated";
        localTimeField = localTimeField || "clientLastUpdated";
        var mergedList = _.clone(remoteList);

        var defaultEquals = function(item1, item2) {
            return item1.id && item1.id === item2.id;
        };
        var eq = _.isFunction(equalsPred) ? equalsPred : defaultEquals;

        var isLocalDataStale = function(remoteItem, localItem) {
            if (!localItem) return true;
            return moment(_.extract(remoteItem, remoteTimeField, epoc)).isAfter(moment(_.extract(localItem, localTimeField, epoc)));
        };

        _.each(localList, function(localItem) {
            var indexOfLocalItemInMergedList = _.findIndex(mergedList, _.curry(eq)(localItem));
            if (indexOfLocalItemInMergedList >= 0) {
                var remoteItem = mergedList[indexOfLocalItemInMergedList];
                if (!isLocalDataStale(remoteItem, localItem)) {
                    mergedList[indexOfLocalItemInMergedList] = localItem;
                    if (!_.isEqual(localItem, remoteItem))
                        console.log("Retaining localItem as it is newer than remoteItem", localItem, remoteItem);
                }
            } else {
                mergedList.push(localItem);
            }
        });

        return mergedList;
    };
});
