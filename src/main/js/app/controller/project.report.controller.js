define(["moment", "dateUtils", "lodash", "orgUnitMapper", "excelBuilder", "constants"], function(moment, dateUtils, _, orgUnitMapper, excelBuilder, constants) {
    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService, pivotTableExportBuilder) {
        $scope.selectedProject = $rootScope.currentUser.selectedProject;

        var REPORTS_LAST_UPDATED_TIME_FORMAT = constants.TIME_FORMAT_12HR,
            REPORTS_LAST_UPDATED_TIME_24HR_FORMAT = constants.TIME_FORMAT_24HR;

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

        var parseProjectAttributes = function(dhisProject) {
            var mapToProjectLabel = {
                name: $scope.resourceBundle.nameLabel,
                projectCode: $scope.resourceBundle.projectCodeLabel,
                projectType: $scope.resourceBundle.projectTypeLabel,
                context: $scope.resourceBundle.contextLabel,
                populationType: $scope.resourceBundle.typeOfPopulationLabel,
                reasonForIntervention: $scope.resourceBundle.reasonForInterventionLabel,
                modeOfOperation: $scope.resourceBundle.modeOfOperationLabel,
                modelOfManagement: $scope.resourceBundle.modelOfManagementLabel,
                openingDate: $scope.resourceBundle.openingDateLabel,
                endDate: $scope.resourceBundle.endDateLabel
            };

            var getProjectMapping = function(orgUnitGroupSets) {
                var addDefaultNameToAttribute = function (orgUnitGroups) {
                    return _.map(orgUnitGroups, function (orgUnitGroup) {
                        var defaultName = {
                            englishName: orgUnitGroup.name
                        };

                        return _.assign(orgUnitGroup, defaultName);
                    });
                };

                var getTranslations = function (code) {
                    var orgUnitGroups = _.find(orgUnitGroupSets, "code", code).organisationUnitGroups;
                    orgUnitGroups = addDefaultNameToAttribute(orgUnitGroups);
                    return translationsService.translate(orgUnitGroups);
                };

                var allContexts = _.sortBy(getTranslations("context"), "name");
                var allPopTypes = _.sortBy(getTranslations("type_of_population"), "name");
                var reasonForIntervention = _.sortBy(getTranslations("reason_for_intervention"), "name");
                var modeOfOperation = _.sortBy(getTranslations("mode_of_operation"), "name");
                var modelOfManagement = _.sortBy(getTranslations("model_of_management"), "name");
                var allProjectTypes = _.sortBy(getTranslations("project_type"), "name");

                return orgUnitMapper.mapToProject(dhisProject, allContexts, allPopTypes, reasonForIntervention, modeOfOperation, modelOfManagement, allProjectTypes);
            };

            var getProjectAttributes = function(projectMapping) {
                var countryLabel = $scope.resourceBundle.country;
                var projectAttributes = [{name: countryLabel, value: dhisProject.parent.name}];

                _.each(mapToProjectLabel, function (value, key) {
                    if(key == 'openingDate') projectMapping[key] = projectMapping[key].toLocaleDateString();
                    if(key == 'endDate') projectMapping[key] = projectMapping[key] ? projectMapping[key].toLocaleDateString() : "";
                    
                    var projectAttribute = {
                        name: value,
                        value: projectMapping[key] && projectMapping[key].name ? projectMapping[key].name : projectMapping[key]
                    };
                    projectAttributes.push(projectAttribute);
                });

                return projectAttributes;
            };

            orgUnitGroupSetRepository.getAll()
                .then(getProjectMapping)
                .then(getProjectAttributes)
                .then(function (projectAttribute) {
                    $scope.projectAttributes = projectAttribute;
                });
        };

        var loadProjectBasicInfo = function() {
            return orgUnitRepository.get($scope.selectedProject.id)
                .then(parseProjectAttributes);
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
