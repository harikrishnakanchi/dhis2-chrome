define(['moment'], function (moment) {
    return function ($rootScope, $q, $scope, $routeParams, orgUnitRepository, changeLogRepository, pivotTableRepository) {
        var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";

        var init = function () {
            var selectedProjectId = $rootScope.currentUser.selectedProject.id,
                opunitId = $routeParams.opUnit;

            var getLastUpdatedTimeForOpUnitPivotTables = function () {
                var changeLogKey = 'monthlyPivotTableData:'.concat(selectedProjectId);
                return changeLogRepository.get(changeLogKey).then(function (lastUpdatedTime) {
                    $scope.lastUpdatedTimeForOpUnitReport = lastUpdatedTime ? moment(lastUpdatedTime).format(REPORTS_LAST_UPDATED_TIME_FORMAT) : undefined;
                });
            };

            var getOpUnitName = function () {
                return orgUnitRepository.get(opunitId).then(function (orgUnit) {
                    $scope.opUnitName = orgUnit.name;
                });
            };

            var filterOpunitPivotTables = function(tables) {
                return _.filter(tables, { 'opUnitReport': true });
            };

            var getDataForPivotTables = function (opunitPivotTables) {
                var promises = _.map(opunitPivotTables, function(report) {
                    return pivotTableRepository.getPivotTableData(report, opunitId);
                });

                return $q.all(promises).then(function (opunitPivotTableData) {
                    $scope.pivotTables =  _.filter(opunitPivotTableData, 'isDataAvailable');
                });
            };

            var loadOpunitPivotTable = function () {
                return pivotTableRepository.getAll()
                    .then(filterOpunitPivotTables)
                    .then(getDataForPivotTables);
            };

            return $q.all([getOpUnitName(), getLastUpdatedTimeForOpUnitPivotTables()], loadOpunitPivotTable());
        };

        init();
    };
});