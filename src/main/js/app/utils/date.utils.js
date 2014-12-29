define(["moment"], function(moment) {
    var toDhisFormat = function(m) {
        return m.isoWeekYear() + "W" + m.isoWeek();
    };

    return {
        "toDhisFormat": toDhisFormat
    };
});