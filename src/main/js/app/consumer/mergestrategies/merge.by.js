define(['mergeByUnion', 'mergeByLastUpdated'], function(mergeByUnion, mergeByLastUpdated) {

    var lastUpdated = function(opts, remoteList, localList) {
        opts = opts || {};
        return mergeByLastUpdated(opts.eq, opts.remoteTimeField, opts.localTimeField, remoteList, localList);
    };

    var union = function(fieldToMerge, remoteList, localList) {
        return mergeByUnion(fieldToMerge, remoteList, localList);
    };

    return {
        "lastUpdated": lastUpdated,
        "union": union
    };
});