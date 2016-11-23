define(['moment', 'excelBuilder'], function (moment, excelBuilder) {
    return function ($rootScope, $q, $scope, $routeParams, orgUnitRepository, changeLogRepository, pivotTableRepository, filesystemService, pivotTableExportBuilder) {
        var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";
        var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";

        var buildSpreadSheetContent = function () {
            var spreadSheetContent,
                EMPTY_ROW = [];

            var getLastUpdatedTimeDetails = function () {
                var formattedTime = moment($scope.lastUpdatedTimeForOpUnitReport, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
                return ['Updated', formattedTime];
            };

            var getPivotTableData = function () {
                return _.flatten(_.map($scope.pivotTables, function (pivotTable) {
                    return [
                        [pivotTable.title]
                    ].concat(pivotTableExportBuilder.build(pivotTable)).concat([EMPTY_ROW, EMPTY_ROW]);
                }));
            };

            spreadSheetContent = getPivotTableData().concat(EMPTY_ROW);

            if ($scope.lastUpdatedTimeForOpUnitReport) {
                spreadSheetContent.unshift(getLastUpdatedTimeDetails(), EMPTY_ROW);
            }

            return [{
                name: $scope.opUnitName,
                data: spreadSheetContent
            }];
        };

        $scope.exportToExcel = function () {
            var lastUpdatedTimeDetails;
            if ($scope.lastUpdatedTimeForOpUnitReport) {
                var formattedDate = moment($scope.lastUpdatedTimeForOpUnitReport, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
                lastUpdatedTimeDetails = '[updated ' + formattedDate + ']';
            }
            else {
                lastUpdatedTimeDetails = moment().format("DD-MMM-YYYY");
            }
            var filename = [$scope.opUnitName, 'OpunitReport', lastUpdatedTimeDetails, 'xlsx'].join('.');
            filesystemService.promptAndWriteFile(filename, excelBuilder.createWorkBook(buildSpreadSheetContent()), filesystemService.FILE_TYPE_OPTIONS.XLSX);
        };

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
                $scope.pivotTables= [];
                $scope.startLoading();
                return pivotTableRepository.getAll()
                    .then(filterOpunitPivotTables)
                    .then(getDataForPivotTables);
            };

            return $q.all([getOpUnitName(), getLastUpdatedTimeForOpUnitPivotTables()], loadOpunitPivotTable())
                .finally($scope.stopLoading);
        };

        init();
    };
});