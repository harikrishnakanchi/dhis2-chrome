define(["lodash", "dhisId", "moment","interpolate", "orgUnitMapper", "customAttributes"], function(_, dhisId, moment, interpolate, orgUnitMapper, customAttributes) {
    return function($scope, $hustle, orgUnitRepository, $q, $location, $timeout, $anchorScroll) {
        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
        };

        $scope.save = function(orgUnit, parentOrgUnit) {
            var typeAttr = customAttributes.createAttribute(customAttributes.TYPE, "Country");
            var newDataModelAttr = customAttributes.createAttribute(customAttributes.NEW_DATA_MODEL_CODE, "true");
            newOrgUnit = {
                'id': dhisId.get(orgUnit.name + parentOrgUnit.id),
                'name': orgUnit.name,
                'level': parseInt(parentOrgUnit.level) + 1,
                'shortName': orgUnit.name,
                'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
                'parent': _.pick(parentOrgUnit, "name", "id"),
                'attributeValues': [typeAttr, newDataModelAttr]
            };

            var onSuccess = function(data) {
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(data[0], "savedCountry");
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDhis = function(data) {
                return $hustle.publish({
                    "data": data,
                    "type": "upsertOrgUnit",
                    "locale": $scope.locale,
                    "desc": interpolate($scope.resourceBundle.upsertOrgUnitDesc, { orgUnit: data[0].name })
                }, "dataValues").then(function() {
                    return data;
                });
            };

            $scope.startLoading();

            return orgUnitRepository.upsert([newOrgUnit])
                .then(saveToDhis)
                .then(onSuccess, onError)
                .finally($scope.stopLoading);
        };

        $scope.reset = function() {
            $scope.saveFailure = false;
            $scope.newOrgUnit = {
                'openingDate': moment().toDate(),
            };
        };

        $scope.closeForm = function(parentOrgUnit) {
            $scope.$parent.closeNewForm(parentOrgUnit);
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var prepareNewForm = function() {
            $scope.reset();
            return orgUnitRepository.getChildOrgUnitNames($scope.orgUnit.id).then(function(data) {
                $scope.allCountries = data;
            });
        };

        var prepareView = function() {
            $scope.reset();
            $scope.newOrgUnit.name = $scope.orgUnit.name;
            $scope.newOrgUnit.openingDate = moment($scope.orgUnit.openingDate).toDate();
        };

        var init = function() {
            if ($scope.isNewMode)
                prepareNewForm();
            else
                prepareView();
        };

        init();
    };
});
