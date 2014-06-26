define(["lodash", "md5", "moment", "orgUnitMapper"], function(_, md5, moment, orgUnitMapper) {
    return function($scope, $hustle, orgUnitService, orgUnitRepository, $q, $location, $timeout, $anchorScroll) {

        $scope.thisDate = moment().format("YYYY-MM-DD");

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
        };

        $scope.save = function(orgUnit, parentOrgUnit) {
            newOrgUnit = {
                'id': md5(orgUnit.name + parentOrgUnit.id).substr(0, 11),
                'name': orgUnit.name,
                'level': parseInt(parentOrgUnit.level) + 1,
                'shortName': orgUnit.name,
                'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
                'parent': _.pick(parentOrgUnit, "name", "id"),
                'attributeValues': [{
                    'attribute': {
                        id: "a1fa2777924"
                    },
                    value: "Country"
                }]
            };

            var onSuccess = function(data) {
                if ($scope.$parent.closeEditForm)
                    $scope.$parent.closeEditForm(data, "savedCountry");
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDhis = function(data) {
                return $hustle.publish({
                    "data": data,
                    "type": "createOrgUnit"
                }, "dataValues");
            };

            return orgUnitRepository.save([newOrgUnit])
                .then(saveToDhis)
                .then(onSuccess, onError);
        };

        $scope.reset = function() {
            $scope.saveFailure = false;
            $scope.newOrgUnit = {
                'openingDate': moment().format("YYYY-MM-DD"),
            };
        };

        $scope.isAfterMaxDate = function() {
            return moment($scope.newOrgUnit.openingDate).isAfter(moment($scope.thisDate));
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var prepareEditForm = function() {
            $scope.reset();
            orgUnitService.getAll("organisationUnits").then(function(allOrgUnits) {
                $scope.allCountries = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
            });
        };

        var prepareView = function() {
            $scope.reset();
            $scope.newOrgUnit.name = $scope.orgUnit.name;
            $scope.newOrgUnit.openingDate = $scope.orgUnit.openingDate;
        };

        var init = function() {
            if ($scope.isEditMode)
                prepareEditForm();
            else
                prepareView();
        };

        init();
    };
});