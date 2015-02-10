define(['mergeByUnion', 'mergeByLastUpdated'], function(mergeByUnion, mergeByLastUpdated) {
    var lastUpdatedUsingCustomEquals = function(equalsPred, remoteList, localList) {
        return mergeByLastUpdated(equalsPred, remoteList, localList);
    };

    var lastUpdated = function(remoteList, localList) {
        return mergeByLastUpdated(undefined, remoteList, localList);
    };

    var union = function(fieldToMerge, remoteList, localList) {
        return mergeByUnion(fieldToMerge, remoteList, localList);
    };

    return {
        "lastUpdatedUsingCustomEquals": lastUpdatedUsingCustomEquals,
        "lastUpdated": lastUpdated,
        "union": union
    };
});
