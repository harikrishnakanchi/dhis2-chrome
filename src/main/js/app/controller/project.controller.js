define(["moment", "orgUnitMapper", "toTree"], function(moment, orgUnitMapper, toTree) {

    return function($scope, orgUnitService, $q, $location, $timeout, $anchorScroll, userService) {

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
            $scope.saveFailure = false;
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

        var prepareEditForm = function() {
            $scope.reset();
            orgUnitService.getAll("organisationUnits").then(function(allOrgUnits) {
                $scope.peerProjects = orgUnitMapper.getChildOrgUnitNames(allOrgUnits, $scope.orgUnit.id);
            });
        };

        var prepareView = function() {
            $scope.reset();
            $scope.newOrgUnit = orgUnitMapper.mapToProjectForView($scope.orgUnit);
            $scope.projectUsers = [];
            userService.getAllProjectUsers($scope.newOrgUnit.name).then(function(projectUsers) {
                _.each(projectUsers, function(user) {
                    var roles = user.userCredentials.userAuthorityGroups.map(function(role) {
                        return role.name;
                    });
                    $scope.projectUsers.push({
                        "username": user.username,
                        "roles": roles.join(", ")
                    });
                });
            });
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