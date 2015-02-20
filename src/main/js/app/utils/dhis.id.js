define(["md5","lodash"], function(md5,_) {
    var get = function(name) {
        if (!name) return undefined;
        name = name.toLowerCase() + _.random(0,9999999999) + new Date().getTime();
        return "a" + md5(name).substring(0, 10);
    };

    return {
        "get": get
    };
});