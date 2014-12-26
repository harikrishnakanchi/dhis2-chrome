define(["moment"], function(moment) {
    var toDhisFormat = function(m) {
        return m.year() + "W" + m.isoWeek();
    };

    return {
        "toDhisFormat": toDhisFormat
    };
});