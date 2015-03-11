define(["dhisMonitor"], function(dhisMonitor) {
    var init = function(app) {
        app.service('dhisMonitor', ['$http', '$log', dhisMonitor]);
    };

    return {
        init: init
    };
});