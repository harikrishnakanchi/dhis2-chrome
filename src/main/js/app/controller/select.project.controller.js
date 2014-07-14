define([], function() {
    return function($scope, $location, $rootScope, orgUnitRepository, userRepository, userPreferenceRepository) {
        $scope.projects = [];

        var init = function() {
            orgUnitRepository.getAllProjects().then(function(orgUnits) {
                $scope.projects = orgUnits;
            });
        };

        var saveUserPreferences = function() {
            var userPreferences = {
                'username': $rootScope.currentUser.userCredentials.username,
                'locale': $rootScope.currentUser.locale,
                'orgUnits': $rootScope.currentUser.organisationUnits || []
            };
            return userPreferenceRepository.save(userPreferences);
        };

        $scope.save = function() {
            $rootScope.currentUser.organisationUnits.push({
                "id": $scope.project.id,
                "name": $scope.project.name
            });

            var onSuccess = function() {
                return $location.path("/dashboard");
            };

            var onFailure = function() {
                $scope.saveFailed = true;
            };

            return userRepository.upsert($rootScope.currentUser).then(saveUserPreferences).then(onSuccess, onFailure);
        };

        init();
    };
});