define(["indexeddbUtils"], function(indexeddbUtils) {
    var init = function(app) {
        app.service("indexeddbUtils", ["$indexedDB", '$q', indexeddbUtils]);
    };
    return {
        init: init
    };
});
