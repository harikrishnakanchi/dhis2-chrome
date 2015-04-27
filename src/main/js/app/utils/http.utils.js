define([], function() {
    var getParamString = function(filterKey, filterValues) {
        var paramString = _.reduce(filterValues, function(acc, v) {
            acc = acc + "filter=" + filterKey + ":eq:" + v + "&";
            return acc;
        }, "");

        return paramString.substring(0, paramString.length - 1) + "&paging=false";
    };

    return {
        "getParamString": getParamString
    };
});
