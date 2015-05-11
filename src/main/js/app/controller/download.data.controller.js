define(["moment", "properties", "lodash", "chromeUtils"], function(moment, properties, _, chromeUtils) {
    return function($scope, $hustle, $q, $rootScope, $timeout) {
        $scope.syncNow = function() {

            var onSuccess = function(response) {
                chromeUtils.createNotification("Download data", $scope.resourceBundle.syncComplete);
            };

            var downloadMetadata = $hustle.publish({
                "type": "downloadMetadata",
                "data": []
            }, "dataValues");

            var downloadSystemSetting = $hustle.publish({
                "type": "downloadSystemSetting",
                "data": []
            }, "dataValues");

            var downloadPatientOriginDetails = $hustle.publish({
                "type": "downloadPatientOriginDetails",
                "data": []
            }, "dataValues");

            var downloadOrgUnit = $hustle.publish({
                "type": "downloadOrgUnit",
                "data": []
            }, "dataValues");

            var downloadOrgUnitGroups = $hustle.publish({
                "type": "downloadOrgUnitGroups",
                "data": []
            }, "dataValues");

            var downloadProgram = $hustle.publish({
                "type": "downloadProgram",
                "data": []
            }, "dataValues");

            var downloadData = $hustle.publish({
                "type": "downloadData",
                "data": []
            }, "dataValues");

            var downloadEvents = $hustle.publish({
                "type": "downloadEventData",
                "data": []
            }, "dataValues");

            var downloadDatasets = $hustle.publish({
                "type": "downloadDatasets",
                "data": []
            }, "dataValues");

            return $q.all([downloadMetadata, downloadSystemSetting, downloadPatientOriginDetails, downloadOrgUnit, downloadOrgUnitGroups,
                    downloadProgram, downloadData, downloadEvents, downloadDatasets
                ])
                .then(onSuccess);
        };
    };
});
