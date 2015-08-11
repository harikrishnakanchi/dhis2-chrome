define([], function(){
	return function($scope, referralLocationsRepository){
		var orderedReferralLocationNames = [
			"MSF Facility 1",
			"MSF Facility 2",
			"MSF Facility 3",
			"MoH Facility 1",
			"MoH Facility 2",
			"MoH Facility 3",
			"Private Facility 1",
			"Private Facility 2",
			"Other Facility"
		];

		$scope.closeForm = function() {
			$scope.$parent.closeNewForm($scope.orgUnit);
		};

		var transformFromDb = function(data) {
			data = data || {};
			return _.map(orderedReferralLocationNames, function(genericName, index){
				return { "genericName" : genericName,
						 "aliasName": data[genericName] || "",
						 "displayOrder" : index
					   };
			});
		};

		var transformReferralLocationsForDb = function() {
			return _.transform($scope.referralLocations, function(result, referralLocation) {
				if(!_.isEmpty(referralLocation.aliasName)) {
					result[referralLocation.genericName] = referralLocation.aliasName;
				}
			}, { "id": $scope.orgUnit.id });
		};

		$scope.save = function() {
			var payload = transformReferralLocationsForDb();
			referralLocationsRepository.upsert(payload).then(function(){
				$scope.$parent.closeNewForm($scope.orgUnit, "savedReferralLocations");
			});
		};

		var init = function(){
			referralLocationsRepository.get($scope.orgUnit.id).then(function(data){
				$scope.referralLocations = transformFromDb(data);
			});
		};
		init();
	};

});