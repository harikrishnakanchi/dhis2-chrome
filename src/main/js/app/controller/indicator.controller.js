define([], function() {
    return function($scope, indicatorRepository) {

    	$scope.parseIndicator = function(indicator){

    	};

        var init = function() {
           var getAllIndicators = function(){
           		return indicatorRepository.getAll();
           };

           getAllIndicators();

        };

        init();
    };
});
