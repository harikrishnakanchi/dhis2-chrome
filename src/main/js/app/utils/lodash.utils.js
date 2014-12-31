define(["lodash"], function(_) {
    _.unionBy = function(lists, key) {
        return _.uniq(_.flatten(lists), key);
    };

    return _;
});
