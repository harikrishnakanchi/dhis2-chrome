define([], function(){
	return function($scope){
		$scope.referralLocations = [
			{
				"genericName": "MSF Facility 1",
				"aliasName":   ""
			},
			{
				"genericName": "MSF Facility 2",
				"aliasName":   ""
			}
		];

		$scope.save = function() {
			$scope.$parent.closeNewForm($scope.orgUnit, "savedReferralLocations")
		};

		$scope.closeForm = function() {
			$scope.$parent.closeNewForm($scope.orgUnit);
		};
	};

});