define(["lodash"], function(_) {
    return function($rootScope, $scope, $hustle, $location, orgUnitRepository, userPreferenceRepository) {

        $scope.savePreference = function() {
            return userPreferenceRepository.get($rootScope.currentUser.userCredentials.username).then(function(userPreference) {
                userPreference.organisationUnits = [$scope.selectedProject.originalObject];
                userPreference.selectedProject = $scope.selectedProject.originalObject;
                $rootScope.currentUser.selectedProject = $scope.selectedProject.originalObject;
                return userPreferenceRepository.save(userPreference).then(function(data) {
                    $hustle.publish({
                        "type": "downloadProjectDataForAdmin",
                        "data": []
                    }, "dataValues");
                    $location.path("/orgUnits");
                });
            });
        };

        var init = function() {
            return orgUnitRepository.getAllProjects().then(function(allProjects) {
                $scope.allProjects = _.sortBy(allProjects, "name");
            });
        };

        init();
    };
});
