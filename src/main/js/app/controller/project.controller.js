define(["moment", "orgUnitMapper", "toTree"], function(moment, orgUnitMapper, toTree) {

    return function($scope, db, orgUnitService, $q, $location, $timeout, $anchorScroll) {

        $scope.allProjectTypes = ['Direct', 'Indirect', 'Project excluded from TYPO analysis and Coordination'];

        $scope.allContexts = ['Armed conflict', 'Post-conflict'];

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
        };


        $scope.save = function(newOrgUnit, parentOrgUnit) {

            var onSuccess = function(data) {
                if ($scope.$parent.closeEditForm)
                    $scope.$parent.closeEditForm(data, "savedProject");
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var dhisProject = new Array(orgUnitMapper.mapToProjectForDhis(newOrgUnit, parentOrgUnit));
            return orgUnitService.create(dhisProject).then(onSuccess, onError);

        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var prepareEditForm = function() {
            $scope.reset();
            getAll("organisationUnits").then(function(allOrgUnits) {
                $scope.peerProjects = orgUnitMapper.getProjects(allOrgUnits, $scope.orgUnit.id);
            });
        };

        var prepareView = function() {
            $scope.reset();
            $scope.newOrgUnit = orgUnitMapper.mapToProjectForView($scope.orgUnit);
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