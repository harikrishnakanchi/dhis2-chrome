define(['dashboardController'], function(dashboardController) {
    var init = function(app) {
        app.controller('dashboardController', ['$scope', dashboardController]);
    };
    return {
        init: init
    };
});