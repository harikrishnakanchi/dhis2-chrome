define(["moment"], function(moment) {
    return function($scope, $hustle, referralLocationsRepository) {
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

        var existingReferralLocations;
        var shouldDisableSaveButton = false;

        $scope.closeForm = function() {
            $scope.$parent.closeNewForm($scope.orgUnit);
        };

        $scope.disableLocation = function(referralLocation) {
            referralLocation.isDisabled = true;
        };

        var hasExistingNameBeenRemoved = function(referralLocation) {
            var hasExistingName = !_.isEmpty(_.find(existingReferralLocations, {
                "genericName": referralLocation.genericName
            }).aliasName);

            if (hasExistingName && _.isEmpty(referralLocation.aliasName)) {
                return true;
            }

            return false;
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
                return {
                    "genericName": genericName,
                    "aliasName": aliasName,
                    "isDisabled": isDisabled
                };
            });
        };

        var transformReferralLocationsForDb = function() {
            var defaultPayload = {
                "id": $scope.orgUnit.id,
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

        var init = function() {
            referralLocationsRepository.get($scope.orgUnit.id).then(function(data) {
                $scope.referralLocations = transformFromDb(data);
                existingReferralLocations = _.cloneDeep($scope.referralLocations);
            });
        };
        init();
    };
});
