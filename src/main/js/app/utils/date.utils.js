define(["moment", "lodash"], function(moment, _) {
    var toDhisFormat = function(m) {
        return m.format("GGGG[W]WW");
    };

    var getFormattedPeriod = function(period) {
        return moment(period, "GGGG[W]W").format("GGGG[W]WW");
    };

    var max = function(dateStrings) {
        var epochs = function(d) {
            return moment(d).valueOf();
        };
        var max = _.max(dateStrings, epochs);
        return moment(max);
    };

    var subtractWeeks = function(numberOfWeeks) {
        return moment().subtract(numberOfWeeks, 'week').format("YYYY-MM-DD");
    };

    return {
        "toDhisFormat": toDhisFormat,
        "max": max,
        "getFormattedPeriod": getFormattedPeriod,
        "subtractWeeks": subtractWeeks
    };
});
