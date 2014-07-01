define(["md5"], function(md5) {
    var get = function(name) {
        return md5(name).substring(0, 11);
    };

    return {
        "get": get
    };
});