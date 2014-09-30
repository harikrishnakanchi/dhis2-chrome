define(['approvalHelper'], function(approvalHelper) {
    var init = function(app) {
        app.service('approvalHelper', ['$hustle', 'approvalDataRepository', approvalHelper]);
    };
    return {
        init: init
    };
});