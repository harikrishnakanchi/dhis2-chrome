define([], function() {

    return function($rootScope, $scope) {
        $scope.projectName = $rootScope.currentUser.selectedProject.name;
    };
});
