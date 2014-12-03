define(["indexeddbUtils"], function(indexeddbUtils) {
    var init = function(app) {
        app.service("indexeddbUtils", ["$indexedDB", indexeddbUtils]);
    };
    return {
        init: init
    };
});
