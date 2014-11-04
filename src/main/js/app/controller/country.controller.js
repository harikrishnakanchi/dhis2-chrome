define(["lodash", "dhisId", "moment", "orgUnitMapper"], function(_, dhisId, moment, orgUnitMapper) {
    return function($scope, $hustle, orgUnitRepository, $q, $location, $timeout, $anchorScroll) {

        $scope.thisDate = moment().toDate();

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
                    'attribute': {
                        "code": "Type",
                        "name": "Type"
                    },
                    value: "Country"
                }]
            };

            parentOrgUnit.children.push(newOrgUnit);

            var onSuccess = function(data) {
                if ($scope.$parent.closeNewForm)
                    $scope.$parent.closeNewForm(data, "savedCountry");
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDhis = function(data) {
                return $hustle.publish({
                    "data": data,
                    "type": "upsertOrgUnit"
                }, "dataValues").then(function() {
                    return data;
                });
            };

            return orgUnitRepository.upsert(parentOrgUnit).then(function() {
                return orgUnitRepository.upsert(newOrgUnit)
                    .then(saveToDhis)
                    .then(onSuccess, onError);
            });
        };

        $scope.reset = function() {
            $scope.saveFailure = false;
            $scope.newOrgUnit = {
                'openingDate': moment().toDate(),
            };
        };

        $scope.isAfterMaxDate = function() {
            return moment($scope.newOrgUnit.openingDate).isAfter(moment($scope.thisDate));
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var prepareNewForm = function() {
            $scope.reset();
            orgUnitRepository.getAll().then(function(allOrgUnits) {
                $scope.allCountries = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
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