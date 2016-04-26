define(["moment"], function(moment) {
    return function($scope, $hustle, $modal, referralLocationsRepository) {
        var orderedReferralLocationNames = [
            "MSF Facility 1",
            "MSF Facility 2",
            "MSF Facility 3",
            "MoH Facility 1",
            "MoH Facility 2",
            "MoH Facility 3",
            "Private Facility 1",
            "Private Facility 2",
            "Other Facility"
        ];

        var shouldDisableSaveButton = false;

        var showModal = function(okCallback, message) {
            $scope.modalMessages = message;
            var modalInstance = $modal.open({
                templateUrl: 'templates/confirm-dialog.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            modalInstance.result.then(okCallback);
        };

        $scope.disableLocation = function(referralLocation) {
            showModal(function() {
                referralLocation.isDisabled = true;
            }, {
                "confirmationMessage": $scope.resourceBundle.disableReferralLocationConfirmationMessage
            });
        };

        $scope.closeForm = function() {
            $scope.$parent.closeNewForm($scope.orgUnit);
        };

        var hasExistingNameBeenRemoved = function(referralLocation) {
            return referralLocation.hasExistingName && _.isEmpty(referralLocation.aliasName);
        };

        $scope.hasBeenEmptied = function(referralLocation) {
            return hasExistingNameBeenRemoved(referralLocation);
        };

        $scope.shouldDisableSaveButton = function() {
            shouldDisableSaveButton = false;
            _.each($scope.referralLocations, function(referralLocation) {
                shouldDisableSaveButton = shouldDisableSaveButton || hasExistingNameBeenRemoved(referralLocation);
            });
            return shouldDisableSaveButton;
        };

        var transformFromDb = function(data) {
            data = data || {};
            return _.map(orderedReferralLocationNames, function(genericName, index) {
                var aliasName = data[genericName] === undefined ? "" : data[genericName].name;
                var isDisabled = data[genericName] === undefined ? false : data[genericName].isDisabled;
                var hasExistingName = !_.isEmpty(aliasName);
                return {
                    "genericName": genericName,
                    "aliasName": aliasName,
                    "hasExistingName": hasExistingName,
                    "isDisabled": isDisabled
                };
            });
        };

        var transformReferralLocationsForDb = function() {
            var defaultPayload = {
                "orgUnit": $scope.orgUnit.id,
                "clientLastUpdated": moment().toISOString()
            };
            return _.transform($scope.referralLocations, function(result, referralLocation) {
                if (!_.isEmpty(referralLocation.aliasName) || referralLocation.isDisabled === true) {
                    result[referralLocation.genericName] = {
                        "name": referralLocation.aliasName,
                        "isDisabled": referralLocation.isDisabled
                    };
                }
            }, defaultPayload);
        };

        var saveToDhis = function() {
            return $hustle.publish({
                "data": $scope.orgUnit.id,
                "type": "uploadReferralLocations",
                "locale": $scope.currentUser.locale,
                "desc": $scope.resourceBundle.uploadReferralLocationsDesc + " " + $scope.orgUnit.name
            }, "dataValues");
        };

        $scope.save = function() {
            var payload = transformReferralLocationsForDb();
            referralLocationsRepository.upsert(payload).then(saveToDhis).then(function() {
                $scope.$parent.closeNewForm($scope.orgUnit, "savedReferralLocations");
            });
        };

        $scope.hasDuplicateReferralLocations = function() {
            var allReferralLocations = _.filter(_.pluck($scope.referralLocations, "aliasName"), function(aliasName) {
                return !_.isEmpty(aliasName);
            });
            return _.uniq(allReferralLocations).length != allReferralLocations.length;
        };

        var init = function() {
            referralLocationsRepository.get($scope.orgUnit.id).then(function(data) {
                $scope.referralLocations = transformFromDb(data);
            });
        };
        init();
    };
});
