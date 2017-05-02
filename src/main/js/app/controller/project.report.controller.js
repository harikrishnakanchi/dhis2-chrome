define(["moment", "dateUtils", "lodash", "orgUnitMapper", "excelBuilder", "constants", "customAttributes"], function(moment, dateUtils, _, orgUnitMapper, excelBuilder, constants, customAttributes) {
    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService, pivotTableExportBuilder) {
        $scope.selectedProject = $rootScope.currentUser.selectedProject;

        var REPORTS_LAST_UPDATED_TIME_FORMAT = constants.TIME_FORMAT_12HR,
            REPORTS_LAST_UPDATED_TIME_24HR_FORMAT = constants.TIME_FORMAT_24HR,
            ORG_UNIT_LEVEL_FOR_PROJECT = 4;

        var buildSpreadSheetContent = function () {
            var EMPTY_ROW = [];

            var getLastUpdatedTimeDetails = function () {
                var formattedTime = $scope.lastUpdatedTimeForProjectReport;
                return [$scope.resourceBundle.updated, formattedTime];
            };

            var getProjectBasicInfo = function() {
                var buildProjectAttribute = function(projectAttribute) {
                    return [projectAttribute.name, projectAttribute.value];
                };

                return [
                    [$scope.resourceBundle.projectInformationLabel]
                ].concat(_.map($scope.projectAttributes, buildProjectAttribute));
            };

            var getPivotTableData = function () {
                return _.flatten(_.map($scope.pivotTables, function (pivotTable) {
                    return [
                        [pivotTable.title]
                    ].concat(pivotTableExportBuilder.build(pivotTable)).concat([EMPTY_ROW, EMPTY_ROW]);
                }));
            };

            var spreadSheetContent = getProjectBasicInfo().concat([EMPTY_ROW]).concat(getPivotTableData());
            if ($scope.lastUpdatedTimeForProjectReport) {
                spreadSheetContent.unshift(getLastUpdatedTimeDetails(), EMPTY_ROW);
            }

            return [{
                name: $scope.selectedProject.name,
                data: spreadSheetContent
            }];
        };

        $scope.exportToExcel = function () {
            var lastUpdatedTimeDetails;
            if ($scope.lastUpdatedTimeForProjectReport) {
                var formattedDate = $scope.lastUpdatedTimeForProjectReport;
                lastUpdatedTimeDetails = '[' + $scope.resourceBundle.updated + ' ' + formattedDate + ']';
            }
            else {
                lastUpdatedTimeDetails = moment().format("DD-MMM-YYYY");
            }
            var filename = [$scope.selectedProject.name, 'ProjectReport', lastUpdatedTimeDetails].join('.');
            filesystemService.promptAndWriteFile(filename, excelBuilder.createWorkBook(buildSpreadSheetContent()), filesystemService.FILE_TYPE_OPTIONS.XLSX);
        };

        var parseProjectAttributes = function (dhisProject, parent, orgUnitGroupSetsForProject) {
            var projectAttributes = [
                {name: $scope.resourceBundle.country, value: parent.name},
                {name: $scope.resourceBundle.nameLabel, value: dhisProject.name},
                {name: $scope.resourceBundle.projectCodeLabel, value: dhisProject.projectCode},
                {name: $scope.resourceBundle.openingDateLabel, value: dhisProject.openingDate.toLocaleDateString()},
                {name: $scope.resourceBundle.endDateLabel, value: (dhisProject.endDate && dhisProject.endDate.toLocaleDateString()) || ""}];

            var orgUnitGroups = _.map(orgUnitGroupSetsForProject, function (orgUnitGroupSet) {
                return {
                    name: orgUnitGroupSet.name,
                    value: dhisProject.orgUnitGroupSets[orgUnitGroupSet.id].name || ""
                };
            });
            $scope.projectAttributes = projectAttributes.concat(orgUnitGroups);
        };

        var getOrgUnitGroupsets = function () {
            return orgUnitGroupSetRepository.getAll().then(function (orgUnitGroupSets) {
                return _.filter(orgUnitGroupSets, function (orgUnitGroupSet) {
                    var orgUnitGroupSetLevel = customAttributes.getAttributeValue(orgUnitGroupSet.attributeValues, customAttributes.ORG_UNIT_GROUP_SET_LEVEL);
                    return orgUnitGroupSetLevel == ORG_UNIT_LEVEL_FOR_PROJECT;
                });
            });
        };

        var loadProjectBasicInfo = function () {
            return $q.all({
                project: orgUnitRepository.get($scope.selectedProject.id),
                orgUnitGroupSetsForProject: getOrgUnitGroupsets()
            }).then(function (data) {
                var project = orgUnitMapper.mapOrgUnitToProject(data.project, data.orgUnitGroupSetsForProject);
                parseProjectAttributes(project, data.project.parent, data.orgUnitGroupSetsForProject);
            });
        };

        var filterProjectReportTables = function(tables) {
            return _.filter(tables, { 'projectReport': true });
        };

        var getDataForPivotTables = function(pivotTables) {
            var promises = _.map(pivotTables, function(pivotTable) {
                return pivotTableRepository.getPivotTableData(pivotTable, $scope.selectedProject.id);
            });

            return $q.all(promises).then(function (pivotTableData) {
                return _.filter(pivotTableData, 'isDataAvailable');
            });
        };

        var loadLastUpdatedTimeForProjectReport = function() {
            var formatLastUpdatedTime = function (date) {
                var timeFormat = $scope.locale == 'fr' ? REPORTS_LAST_UPDATED_TIME_24HR_FORMAT : REPORTS_LAST_UPDATED_TIME_FORMAT;
                return date ? moment.utc(date).local().locale($scope.locale).format(timeFormat) : undefined;
            };

            return changeLogRepository.get('yearlyPivotTableData:' +  $scope.selectedProject.id)
                .then(formatLastUpdatedTime)
                .then(function(lastUpdated) {
                $scope.lastUpdatedTimeForProjectReport = lastUpdated;
            });
        };

        var loadPivotTables = function() {
            return pivotTableRepository.getAll()
                .then(filterProjectReportTables)
                .then(translationsService.translate)
                .then(getDataForPivotTables)
                .then(translationsService.translatePivotTableData)
                .then(_.partialRight(_.sortBy, 'displayPosition'))
                .then(filterSelectedYearData);
        };

        var filterSelectedYearData = function (pivotTables) {
            $scope.pivotTables = _.each(pivotTables, function (pivotTable) {
                pivotTable.columnConfigurations[0] = _.filter(pivotTable.columnConfigurations[0], function (columnConfiguration) {
                    return _.includes(columnConfiguration.id, $scope.selectedYear);
                });
                pivotTable.columns[0] = _.filter(pivotTable.columns[0], function (column) {
                    return _.includes(column.id, $scope.selectedYear);
                });
                if(pivotTable.columnConfigurations[0].length === 0) {
                    pivotTable.isDataAvailable = false;
                }
            });
        };

        $scope.setSelectedYear = function(year) {
            $scope.selectedYear = year;
            init();
        };

        var init = function() {
            $scope.last4years = dateUtils.getPeriodRangeInYears(4).reverse();
            $scope.selectedYear = $scope.selectedYear || _.first($scope.last4years);

            $scope.pivotTables= [];
            $scope.startLoading();
            $q.all([loadProjectBasicInfo(), loadPivotTables(), loadLastUpdatedTimeForProjectReport()])
                .finally($scope.stopLoading);
        };

        init();
    };

});
