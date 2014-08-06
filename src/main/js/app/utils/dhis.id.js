define(["md5"], function(md5) {
    var get = function(name) {
        if (!name) return undefined;
        return "a" + md5(name.toLowerCase()).substring(0, 10);
    };

    return {
        "get": get
    };
});