define(["moment", "lodash"], function(moment, _) {
    var toDhisFormat = function(m) {
        return m.format("GGGG[W]W");
    };

    var max = function(dateStrings) {
        var epochs = function(d) {
            return moment(d).valueOf();
        };
        var max = _.max(dateStrings, epochs);
        return moment(max);
    };

    return {
        "toDhisFormat": toDhisFormat,
        "max": max
    };
});
