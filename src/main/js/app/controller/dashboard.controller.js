define([], function() {
    return function($scope, dataService) {
        $scope.message = "";
        $scope.syncNow = function() {
            $scope.message = "Syncing... Plz Wait...";
            dataService.fetch("company_0", "DS_ATFC").then(foo);

        };

        var foo = function(response) {
            $scope.message = response.message;
        };
    };
});