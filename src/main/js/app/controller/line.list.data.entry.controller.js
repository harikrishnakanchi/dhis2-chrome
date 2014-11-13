define(["lodash", "moment"], function() {
    return function($scope, programRepository) {

        var init = function() {

        	$scope.programs = _.transform($scope.programsInCurrentModule, function(acc, programId){
        		programRepository.getProgramAndStages(programId).then(function(programAndStage){
        			acc.push(programAndStage);
        		});
        	}); 

			$scope.loading = true;
			$scope.title = "Line List Data Entry Controller";
			$scope.loading = false;
        };

        init();
    };
});