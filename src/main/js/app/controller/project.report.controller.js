define(["moment", "dateUtils", "lodash", "orgUnitMapper"], function(moment, dateUtils, _, orgUnitMapper) {
    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository, changeLogRepository, translationsService, orgUnitGroupSetRepository, filesystemService, pivotTableCsvBuilder) {
        $scope.selectedProject = $rootScope.currentUser.selectedProject;

        var REPORTS_LAST_UPDATED_TIME_FORMAT = "D MMMM[,] YYYY hh[.]mm A";
        var REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA = "D MMMM YYYY hh[.]mm A";

        var buildCsvContent = function () {
            var DELIMITER = ',',
                NEW_LINE = '\n',
                EMPTY_CELL = '';

            var escapeString = function (string) {
                return '"' + string + '"';
            };

            var getLastUpdatedTimeDetails = function () {
                var formattedTime = moment($scope.lastUpdatedTimeForProjectReport, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
                return [escapeString('Updated'), escapeString(formattedTime)].join(DELIMITER);
            };

            var getProjectBasicInfo = function() {
                var buildProjectAttribute = function(projectAttribute) {
                    return [
                        escapeString(projectAttribute.name),
                        escapeString(projectAttribute.value)
                    ].join(DELIMITER);
                };

                return _.flatten([
                    escapeString($scope.resourceBundle.projectInformationLabel),
                    _.map($scope.projectAttributes, buildProjectAttribute)
                ]).join(NEW_LINE);
            };

            var getPivotTableData = function () {
                return _.map($scope.pivotTables, function (pivotTable) {
                    return [
                        escapeString(pivotTable.title),
                        pivotTableCsvBuilder.build(pivotTable)
                    ].join(NEW_LINE);
                }).join(NEW_LINE + NEW_LINE);
            };

            var csvContent = [
                getProjectBasicInfo(),
                EMPTY_CELL,
                getPivotTableData()
            ];

            if ($scope.lastUpdatedTimeForProjectReport) {
                csvContent.unshift(getLastUpdatedTimeDetails(), EMPTY_CELL);
            }

            return csvContent.join(NEW_LINE);
        };

        $scope.exportToCSV = function () {
            var lastUpdatedTimeDetails;
            if ($scope.lastUpdatedTimeForProjectReport) {
                var formattedDate = moment($scope.lastUpdatedTimeForProjectReport, REPORTS_LAST_UPDATED_TIME_FORMAT).format(REPORTS_LAST_UPDATED_TIME_FORMAT_WITHOUT_COMMA);
                lastUpdatedTimeDetails = '[updated ' + formattedDate + ']';
            }
            else {
                lastUpdatedTimeDetails = moment().format("DD-MMM-YYYY");
            }
            var filename = [$scope.selectedProject.name, 'ProjectReport', lastUpdatedTimeDetails, 'csv'].join('.');
            filesystemService.promptAndWriteFile(filename, new Blob([buildCsvContent()], {type: 'text/csv'}), filesystemService.FILE_TYPE_OPTIONS.CSV);
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
            var formatlastUpdatedTime = function (date) {
                return date ? moment(date).format(REPORTS_LAST_UPDATED_TIME_FORMAT) : undefined;
            };

            return changeLogRepository.get('monthlyPivotTableData:' +  $scope.selectedProject.id)
                .then(formatlastUpdatedTime)
                .then(function(lastUpdated) {
                $scope.lastUpdatedTimeForProjectReport = lastUpdated;
            });
        };

        var loadPivotTables = function() {
            return pivotTableRepository.getAll()
                .then(filterProjectReportTables)
                .then(getDataForPivotTables)
                .then(translationsService.translatePivotTableData)
                .then(function(pivotTables) {
                    $scope.pivotTables = _.sortBy(pivotTables, 'displayPosition');
                });
        };

        var init = function() {
            $scope.pivotTables= [];
            $scope.loading = true;
            $q.all([loadProjectBasicInfo(), loadPivotTables(), loadLastUpdatedTimeForProjectReport()]).finally(function () {
                $scope.loading = false;
            });
        };

        init();
    };

});
