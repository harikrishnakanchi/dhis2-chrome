define(["lodashUtils", "moment"], function(_, moment) {
    return function(remoteList, localList) {

        var isLocalDataStale = function(remoteItem, localItem) {
            if (!localItem)
                return true;

            if (localItem.clientLastUpdated === undefined)
                return moment(remoteItem.lastUpdated).isAfter(moment(localItem.lastUpdated));

            return moment(remoteItem.lastUpdated).isAfter(moment(localItem.clientLastUpdated));
        };

        var groupedLocalItems = _.indexBy(localList, "id");

        return _.transform(remoteList, function(acc, remoteItem) {
            if (isLocalDataStale(remoteItem, groupedLocalItems[remoteItem.id])) {
                acc.push(remoteItem);
            } else
                acc.push(groupedLocalItems[remoteItem.id]);
        });

    };
});
