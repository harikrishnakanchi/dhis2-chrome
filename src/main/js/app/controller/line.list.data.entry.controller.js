define(["lodash", "moment"], function() {
    return function($scope) {
        var init = function() {
			$scope.loading = true;
			$scope.title = "Line List Data Entry Controller";
			$scope.loading = false;
        };

        init();
    };
});