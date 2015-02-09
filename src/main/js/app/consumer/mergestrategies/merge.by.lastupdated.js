define(["lodashUtils", "moment"], function(_, moment) {
    return function(equalsPred, remoteList, localList) {
        var defaultEqualsPredicate = function(item1, item2) {
            return item1.id === item2.id;
        };

        var isLocalDataStale = function(remoteItem, localItem) {
            if (!localItem)
                return true;

            if (localItem.clientLastUpdated === undefined)
                return moment(remoteItem.lastUpdated).isAfter(moment(localItem.lastUpdated));

            return moment(remoteItem.lastUpdated).isAfter(moment(localItem.clientLastUpdated));
        };

        equalsPred = _.isFunction(equalsPred) ? equalsPred : defaultEqualsPredicate;

        var mergedList = _.clone(remoteList);

        _.each(localList, function(localItem) {
            var indexOfLocalItemInMergedList = _.findIndex(mergedList, _.curry(equalsPred)(localItem));
            if (indexOfLocalItemInMergedList >= 0) {
                var remoteItem = mergedList[indexOfLocalItemInMergedList];
                if (!isLocalDataStale(remoteItem, localItem)) {
                    mergedList[indexOfLocalItemInMergedList] = localItem;
                }
            } else {
                mergedList.push(localItem)
            }
        });

        return mergedList;
    };
});
