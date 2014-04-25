define(["lodash", "md5", "moment"], function(_, md5, moment) {
    return function($scope, orgUnitService, db, $q, $location, $timeout, $anchorScroll) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.thisDate = new Date();

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            newOrgUnit = _.merge(newOrgUnit, {
                'id': md5(newOrgUnit.name + parentOrgUnit.name).substr(0, 11),
                'shortName': newOrgUnit.name,
                'level': 3,
                'openingDate': moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                'parent': _.pick(parentOrgUnit, "name", "id")
            });

            var onSuccess = function(data) {
                $location.hash([data]);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert([newOrgUnit]);
            };

            return orgUnitService.create([newOrgUnit]).then(saveToDb).then(onSuccess, onError);

        };

        $scope.reset = function() {
            $scope.newOrgUnit = {
                'openingDate': new Date(),
            };
            $scope.saveFailure = $scope.saveSuccess = false;
            $scope.openCreateForm = false;
        };

        var init = function() {
            $scope.reset();
            if (!$scope.isEditMode) {
                $scope.newOrgUnit.name = $scope.orgUnit.name;
                $scope.newOrgUnit.openingDate = $scope.orgUnit.openingDate;
            }
        };

        init();
    };
});