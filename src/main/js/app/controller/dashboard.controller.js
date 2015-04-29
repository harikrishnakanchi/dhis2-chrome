define(["moment", "properties", "lodash"], function(moment, properties, _) {
    return function($scope, $hustle, $q, $rootScope, $timeout) {
        $scope.syncNow = function() {
            $scope.showMessage = true;
            $scope.message = $scope.resourceBundle.syncRunning;

            var onSuccess = function(response) {
                $scope.displayMessage($scope.resourceBundle.syncComplete, false);
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

        $scope.displayMessage = function(messageText, isErrorMessage) {
            var hideMessage = function() {
                $scope.showMessage = false;
                $scope.message = "";
                $scope.messageClass = "";
            };

            $scope.showMessage = true;
            $scope.message = messageText;
            $scope.messageClass = isErrorMessage ? "alert alert-danger" : "alert alert-success";
            $timeout(hideMessage, properties.messageTimeout);
        };
    };
});
