define(["lodash"], function(_) {
    return function($rootScope, $scope, $hustle, $location, orgUnitRepository, userPreferenceRepository, systemSettingRepository) {

        $scope.savePreference = function() {
            return userPreferenceRepository.get($rootScope.currentUser.userCredentials.username).then(function(userPreference) {
                userPreference.organisationUnits = [$scope.selectedProject.originalObject];
                userPreference.selectedProject = $scope.selectedProject.originalObject;
                $rootScope.currentUser.selectedProject = $scope.selectedProject.originalObject;
                $rootScope.currentUser.organisationUnits = userPreference.organisationUnits;
                return userPreferenceRepository.save(userPreference).then(function(data) {
                    $hustle.publishOnce({
                        type: 'downloadProjectDataForAdmin',
                        data: [],
                        locale: $scope.locale
                    }, 'dataValues');
                    $location.path("/orgUnits");
                });
            });
        };

        var init = function() {
             var allowedOrgUnits =  systemSettingRepository.getAllowedOrgUnits();
             var productKeyLevel = systemSettingRepository.getProductKeyLevel();

             if (productKeyLevel === "project") {
                 return orgUnitRepository.findAll(_.pluck(allowedOrgUnits, "id")).then(function(projects) {
                     $scope.allProjects = _.sortBy(projects, "name");
                 });
             }

             if (productKeyLevel === "country") {
                 return orgUnitRepository.findAllByParent(_.pluck(allowedOrgUnits, "id"), true).then(function(projects) {
                     $scope.allProjects = _.sortBy(projects, "name");
                 });
             }

            return orgUnitRepository.getAllProjects().then(function(allProjects) {
                $scope.allProjects = _.sortBy(allProjects, "name");
            });
        };

        init();
    };
});
