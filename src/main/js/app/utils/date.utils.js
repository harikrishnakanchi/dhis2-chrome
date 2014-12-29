define(["moment"], function(moment) {
    var toDhisFormat = function(m) {
        return m.format("GGGG[W]WW");
    };

    return {
        "toDhisFormat": toDhisFormat
    };
});