define(['dashboardController'], function(dashboardController) {
    var init = function(app) {
        app.controller('dashboardController', ['$scope', '$indexedDB', dashboardController]);
    };
    return {
        init: init
    };
});