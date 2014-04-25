define(["moment", "orgUnitMapper"], function(moment, orgUnitMapper) {

    return function($scope, db, orgUnitService, $q, $location, $timeout, $anchorScroll) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.allProjectTypes = ['Direct', 'Indirect', 'Project excluded from TYPO analysis and Coordination'];

        $scope.allContexts = ['Armed conflict', 'Post-conflict'];

        $scope.allConsultDays = ['1', '2', '3', '4', '5', '6', '7'];

        $scope.allPopTypes = ['Displaced', 'General Population', 'Mixed - Displaced/General', 'Victims of Natural Disaster'];

        $scope.thisDate = moment().toDate();

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
            $scope.endDate = false;
        };

        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = false;
            $scope.endDate = true;
        };

        $scope.reset = function() {
            $scope.newOrgUnit = {
                'openingDate': new Date(),
            };
            $scope.saveFailure = $scope.saveSuccess = false;
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            var onSuccess = function(data) {
                $location.hash(data);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var dhisProject = new Array(orgUnitMapper.mapToProjectForDhis(newOrgUnit, parentOrgUnit));
            return orgUnitService.create(dhisProject).then(onSuccess, onError);

        };

        var init = function() {
            $scope.reset();
            if (!$scope.isEditMode)
                $scope.newOrgUnit = orgUnitMapper.mapToProjectForView($scope.orgUnit);
        };

        init();
    };
});