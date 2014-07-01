define(["md5"], function(md5) {
    var get = function(name) {
        if (!name) return undefined;
        return md5(name.toLowerCase()).substring(0, 11);
    };

    return {
        "get": get
    };
});