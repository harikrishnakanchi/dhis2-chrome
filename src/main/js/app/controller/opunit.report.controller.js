define(['moment'], function (moment) {
    return function ($rootScope, $q, $scope, $routeParams, orgUnitRepository, changeLogRepository) {
        var init = function () {

            var getLastUpdatedTimeForReports = function () {
                var changeLogKey = 'monthlyPivotTableData:'.concat($rootScope.currentUser.selectedProject.id);
                return changeLogRepository.get(changeLogKey).then(function (lastUpdatedTime) {
                    $scope.lastUpdatedTimeForOpUnitReport = moment(lastUpdatedTime).format("D MMMM[,] YYYY hh[.]mm A");
                });
            };

            var getOpUnitName = function () {
                return orgUnitRepository.get($routeParams.opUnit).then(function (orgUnit) {
                    $scope.opUnitName = orgUnit.name;
                });
            };

            return $q.all([getOpUnitName(), getLastUpdatedTimeForReports()]);
        };

        init();
    };
});