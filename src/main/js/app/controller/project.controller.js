define(["moment", "orgUnitMapper", "toTree", "properties"], function(moment, orgUnitMapper, toTree, properties) {

    return function($scope, $hustle, orgUnitService, orgUnitRepository, $q, $location, $timeout, $anchorScroll, userRepository, $modal) {

        $scope.allProjectTypes = ['Direct', 'Indirect', 'Project excluded', 'Coordination', 'Remote Control'].sort();

        $scope.allContexts = ['Armed Conflict', 'Post-Conflict', 'Stable', 'Internal Instability'].sort();

        $scope.allPopTypes = ['Displaced', 'General Population', 'Mixed Displaced/General', 'Victims of Natural Disasters'].sort();

        var allEventsExceptOther = ['Armed Conflict: direct violence towards the civilian population', 'Armed Conflict: disruption of health systems due to conflict',
            'Armed Conflict: refugees/internally displaced people', 'Population affected by endemics/epidemics',
            'Population affected by natural disaster', 'Population affected by social violence and health care exclusion',
            'Victims of armed conflict'
        ].sort();

        $scope.allEvents = allEventsExceptOther.concat(['Other']);


        $scope.thisDate = moment().format("YYYY-MM-DD");

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
                'openingDate': moment().format("YYYY-MM-DD")
            };
        };

        var publishMessage = function(data, action) {
            return $hustle.publish({
                "data": data,
                "type": action
            }, "dataValues");
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

            return orgUnitRepository.upsert(dhisProject)
                .then(function(data) {
                    return publishMessage(data, "createOrgUnit");
                })
                .then(onSuccess, onError);
        };

        $scope.toggleUserDisabledState = function(user) {
            $scope.toggleStateUsername = user.userCredentials.username;
            $scope.isUserToBeDisabled = !user.userCredentials.disabled;
            $scope.userStateSuccessfullyToggled = false;

            var modalInstance = $modal.open({
                templateUrl: 'templates/toggle-disable-state-confirmation.html',
                controller: 'confirmDialogController',
                scope: $scope
            });

            var onTimeOut = function() {
                $scope.userStateSuccessfullyToggled = false;
            };

            var okConfirmation = function() {
                user.userCredentials.disabled = $scope.isUserToBeDisabled;
                return userRepository.upsert(user)
                    .then(function(data) {
                    return publishMessage(data, "updateUser");
                    });
            };

            modalInstance.result.then(okConfirmation).then(function() {
                $scope.userStateSuccessfullyToggled = true;
                $timeout(onTimeOut, properties.messageTimeout);
            }, function() {
                $scope.userStateSuccessfullyToggled = false;
                $timeout(onTimeOut, properties.messageTimeout);
            });
        };

        $scope.isAfterMaxDate = function() {
            return moment($scope.newOrgUnit.openingDate).isAfter(moment($scope.thisDate));
        };

        $scope.setUserProject = function() {
            $scope.currentUser.organisationUnits = [$scope.orgUnit];
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        var setProjectUsersForView = function(projectUsers) {
            $scope.projectUsers = [];
            _.each(projectUsers, function(user) {
                var roles = user.userCredentials.userAuthorityGroups.map(function(role) {
                    return role.name;
                });
                user.roles = roles.join(", ");
                $scope.projectUsers.push(user);
            });
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
            userRepository.getAllProjectUsers($scope.orgUnit).then(setProjectUsersForView);
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