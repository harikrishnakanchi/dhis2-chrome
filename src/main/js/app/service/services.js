define(["metadataService", "dataService", "orgUnitService", "userService", "approvalService", "dataValuesService"],
    function(metadataService, dataService, orgUnitService, userService, approvalService, dataValuesService) {
        var init = function(app) {
            app.service('metadataService', ['$http', '$indexedDB', metadataService]);
            app.service('dataService', ['$http', '$q', dataService]);
            app.service('orgUnitService', ['$http', '$indexedDB', orgUnitService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('userService', ['$http', '$indexedDB', userService]);
            app.service('approvalService', ['$http', '$indexedDB', approvalService]);
            app.service('dataValuesService', ['dataService', 'dataRepository', 'dataSetRepository', 'userPreferenceRepository', '$q', dataValuesService]);
        };
        return {
            init: init
        };
    });