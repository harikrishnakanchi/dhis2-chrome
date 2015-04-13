define(["lodash", "dhisId", "moment", "orgUnitMapper"], function(_, dhisId, moment, orgUnitMapper) {
    return function($scope, $hustle, orgUnitRepository, $q, $location, $timeout, $anchorScroll) {
        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
        };

        $scope.save = function(orgUnit, parentOrgUnit) {
            newOrgUnit = {
                'id': dhisId.get(orgUnit.name + parentOrgUnit.id),
                'name': orgUnit.name,
                'level': parseInt(parentOrgUnit.level) + 1,
                'shortName': orgUnit.name,
                'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
                'parent': _.pick(parentOrgUnit, "name", "id"),
                'attributeValues': [{
                    'created': moment().toISOString(),
                    'lastUpdated': moment().toISOString(),
                    'attribute': {
                        "code": "Type",
                        "name": "Type"
                    },
                    'value': "Country"
                }, {
                    'created': moment().toISOString(),
                    'lastUpdated': moment().toISOString(),
                    'attribute': {
                        "code": "isNewDataModel",
                        "name": "Is New Data Model"
                    },
                    'value': "true"
                }]
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
                    "locale": $scope.currentUser.locale,
                    "desc": $scope.resourceBundle.upsertOrgUnitDesc + data[0].name
                }, "dataValues").then(function() {
                    return data;
                });
            };

            $scope.loading = true;

            return orgUnitRepository.upsert([newOrgUnit])
                .then(saveToDhis)
                .then(onSuccess, onError)
                .finally(function() {
                    $scope.loading = false;
                });
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
