define(["dhisMonitor"], function(dhisMonitor) {
    var init = function(app) {
        app.service('dhisMonitor', ['$http', dhisMonitor]);
    };

    return {
        init: init
    };
});