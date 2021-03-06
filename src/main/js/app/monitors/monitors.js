define(["dhisMonitor", "hustleMonitor"], function(dhisMonitor, hustleMonitor) {
    var init = function(app) {
        app.service('dhisMonitor', ['$http', '$log', '$timeout', '$rootScope', 'userPreferenceRepository', dhisMonitor]);
        app.service('hustleMonitor', ['$hustle', '$log', '$q', hustleMonitor]);
    };

    return {
        init: init
    };
});
