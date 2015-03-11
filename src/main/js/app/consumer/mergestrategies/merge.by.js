define(['mergeByUnion', 'mergeByLastUpdated'], function(mergeByUnion, mergeByLastUpdated) {
    return function($log) {
        var lastUpdated = function(opts, remoteList, localList) {
            opts = opts || {};
            return mergeByLastUpdated(opts.eq, opts.remoteTimeField, opts.localTimeField, remoteList, localList, $log);
        };

        var union = function(fieldToMerge, groupByField, remoteList, localList) {
            return mergeByUnion(fieldToMerge, groupByField, remoteList, localList, $log);
        };

        return {
            "lastUpdated": lastUpdated,
            "union": union
        };
    };
});