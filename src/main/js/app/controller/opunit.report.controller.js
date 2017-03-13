define(['moment', 'excelBuilder', 'constants'], function (moment, excelBuilder, constants) {
    return function ($rootScope, $q, $scope, $routeParams, orgUnitRepository, changeLogRepository, pivotTableRepository, filesystemService, translationsService, pivotTableExportBuilder) {
        var REPORTS_LAST_UPDATED_TIME_FORMAT = constants.TIME_FORMAT_12HR,
            REPORTS_LAST_UPDATED_TIME_24HR_FORMAT = constants.TIME_FORMAT_24HR;

        var buildSpreadSheetContent = function () {
            var spreadSheetContent,
                EMPTY_ROW = [];

            var getLastUpdatedTimeDetails = function () {
                var formattedTime = $scope.lastUpdatedTimeForOpUnitReport;
                return [$scope.resourceBundle.updated, formattedTime];
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
                var formattedDate = $scope.lastUpdatedTimeForOpUnitReport;
                lastUpdatedTimeDetails = '[' + $scope.resourceBundle.updated + ' ' + formattedDate + ']';
            }
            else {
                lastUpdatedTimeDetails = moment().format("DD-MMM-YYYY");
            }
            var filename = [$scope.opUnitName, 'OpUnitReport', lastUpdatedTimeDetails, 'xlsx'].join('.');
            filesystemService.promptAndWriteFile(filename, excelBuilder.createWorkBook(buildSpreadSheetContent()), filesystemService.FILE_TYPE_OPTIONS.XLSX);
        };

        var init = function () {
            var selectedProjectId = $rootScope.currentUser.selectedProject.id,
                opunitId = $routeParams.opUnit;

            var getLastUpdatedTimeForOpUnitPivotTables = function () {
                var changeLogKey = 'monthlyPivotTableData:'.concat(selectedProjectId);
                return changeLogRepository.get(changeLogKey).then(function (lastUpdatedTime) {

                    var formatLastUpdatedTime = function (date) {
                        var timeFormat = $scope.locale == 'fr' ? REPORTS_LAST_UPDATED_TIME_24HR_FORMAT : REPORTS_LAST_UPDATED_TIME_FORMAT;
                        return date ? moment.utc(date).local().locale($scope.locale).format(timeFormat) : undefined;
                    };

                    $scope.lastUpdatedTimeForOpUnitReport = formatLastUpdatedTime(lastUpdatedTime);
                });
            };

            var getOpUnitName = function () {
                return orgUnitRepository.get(opunitId).then(function (orgUnit) {
                    $scope.opUnitName = orgUnit.name;
                });
            };

            var filterOpUnitPivotTables = function(tables) {
                return _.filter(tables, { 'opUnitReport': true });
            };

            var getDataForPivotTables = function (opUnitPivotTables) {
                var promises = _.map(opUnitPivotTables, function(report) {
                    return pivotTableRepository.getPivotTableData(report, opunitId);
                });

                return $q.all(promises).then(function (opUnitPivotTableData) {
                    return _.filter(opUnitPivotTableData, 'isDataAvailable');
                });
            };

            var translatePivotTableData = function (pivotTables) {
                return translationsService.translatePivotTableData(pivotTables);
            };

            var loadOpunitPivotTable = function () {
                $scope.pivotTables= [];
                return pivotTableRepository.getAll()
                    .then(filterOpUnitPivotTables)
                    .then(translationsService.translate)
                    .then(getDataForPivotTables)
                    .then(translatePivotTableData)
                    .then(function (pivotTables) {
                        $scope.pivotTables = pivotTables;
                    });
            };

            $scope.startLoading();
            return $q.all([
                getOpUnitName(),
                getLastUpdatedTimeForOpUnitPivotTables()
            ])
                .then(loadOpunitPivotTable)
                .finally($scope.stopLoading);
        };

        init();
    };
});