define(["lodash"], function(_) {
    _.unionBy = function(lists, key) {
        return _.uniq(_.flatten(lists), key);
    };

    _.xorBy = function(list1, list2, key) {
        return _.xor(_.pluck(list1, key), _.pluck(list2, key));
    };

    _.groupByArray = function(objects, key) {
        var groupedObject = {};
        _.forEach(objects, function(o) {
            _.forEach(o[key], function(k) {
                if (groupedObject[k]) {
                    groupedObject[k].push(o);
                } else {
                    groupedObject[k] = [o];
                }
            });
        });
        return groupedObject;
    };

    return _;
});
