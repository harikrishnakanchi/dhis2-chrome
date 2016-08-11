define(["moment", "dateUtils", "lodash", "orgUnitMapper"], function(moment, dateUtils, _, orgUnitMapper) {
    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository, translationsService, orgUnitGroupSetRepository, filesystemService) {
        $scope.selectedProject = $rootScope.currentUser.selectedProject;

        var buildCsvContent = function () {
            var DELIMITER = ',',
                NEW_LINE = '\n',
                EMPTY_CELL = '';

            var escapeString = function (string) {
                return '"' + string + '"';
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

            var getNumberOfWeeksLabel = function (month) {
                return '[' + dateUtils.getNumberOfISOWeeksInMonth(month) + ' ' + $scope.resourceBundle.weeksLabel + ']';
            };

            var getPivotTableData = function () {
                var pivotTableCSVs = _.map($scope.pivotTables, function (pivotTable) {
                    var baseColumnConfiguration = _.last(pivotTable.columns);

                    var buildHeaders = function() {
                        return _.map(pivotTable.columns, function (columnConfiguration) {
                            var columnWidth = baseColumnConfiguration.length / columnConfiguration.length,
                                cells = [pivotTable.title];

                            _.each(columnConfiguration, function (column) {
                                _.times(columnWidth, function () {
                                    if(pivotTable.monthlyReport && column.periodDimension) {
                                        cells.push(escapeString(column.name + ' ' + getNumberOfWeeksLabel(column.id)));
                                    } else {
                                        cells.push(escapeString(column.name));
                                    }
                                });
                            });
                            return cells.join(DELIMITER);
                        });
                    };

                    var buildRows = function () {
                        return _.map(pivotTable.rows, function (row) {
                            var cells = [escapeString(pivotTable.getDisplayName(row))];

                            _.each(baseColumnConfiguration, function (column) {
                                var value = pivotTable.getDataValue(row, column);
                                cells.push(value);
                            });
                            return cells.join(DELIMITER);
                        });
                    };

                    return _.flatten([
                        buildHeaders(),
                        buildRows()
                    ]).join(NEW_LINE);
                });

                return pivotTableCSVs.join(NEW_LINE + NEW_LINE);
            };

            return [
                getProjectBasicInfo(),
                EMPTY_CELL,
                getPivotTableData()
            ].join(NEW_LINE);
        };

        $scope.exportToCSV = function () {
            var filename = [$scope.selectedProject.name, 'ProjectReport', moment().format("DD-MMM-YYYY"), 'csv'].join('.');
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

        var getDataForPivotTables = function(tables) {
            return $q.all(_.map(tables, function(tableDefinition) {
                return pivotTableRepository.getPivotTableData(tableDefinition, $scope.selectedProject.id);
            }));
        };

        var loadPivotTables = function() {
            return pivotTableRepository.getAll()
                .then(filterProjectReportTables)
                .then(getDataForPivotTables)
                .then(translationsService.translatePivotTableData)
                .then(function(pivotTables) {
                    $scope.pivotTables = _.sortBy(_.filter(pivotTables, { isTableDataAvailable: true }), 'displayPosition');
                });
        };

        var init = function() {
            $scope.pivotTables= [];
            $scope.loading = true;
            $q.all([loadProjectBasicInfo(), loadPivotTables()]).finally(function () {
                $scope.loading = false;
            });
        };

        init();
    };

});
