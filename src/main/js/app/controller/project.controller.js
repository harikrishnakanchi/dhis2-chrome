define(["toTree", "lodash", "md5", "moment"], function(toTree, _, md5, moment) {

    return function($scope, db, projectsService, $q, $location, $timeout, $anchorScroll) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
        };

        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.endDate = true;
        };

        $scope.reset = function() {
            $scope.newOrgUnit = {
                'openingDate': new Date(),
            };
            $scope.saveFailure = $scope.saveSuccess = false;
            $scope.openCreateForm = false;
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            newOrgUnit = _.merge(newOrgUnit, {
                'id': md5(newOrgUnit.name + parentOrgUnit.name).substr(0, 11),
                'shortName': newOrgUnit.name,
                'level': 4,
                'openingDate': moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                'endDate': moment(newOrgUnit.endDate).format("YYYY-MM-DD"),
                'parent': _.pick(parentOrgUnit, "name", "id")
            });

            var onSuccess = function(data) {
                $location.hash(data);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert(newOrgUnit);
            };

            return projectsService.create(newOrgUnit).then(saveToDb).then(onSuccess, onError);

        };
    };
});