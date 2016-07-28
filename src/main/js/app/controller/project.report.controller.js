define(["moment", "lodash", "orgUnitMapper"], function(moment, _, orgUnitMapper) {
    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository, translationsService, orgUnitGroupSetRepository, filesystemService) {
        $scope.selectedProject = $rootScope.currentUser.selectedProject;

        var getNumberOfISOWeeksInMonth = function (period) {
            var m = moment(period, 'YYYYMM');

            var year = parseInt(m.format('YYYY'));
            var month = parseInt(m.format('M')) - 1;
            var day = 1,
                mondays = 0;

            var date = new Date(year, month, day);

            while (date.getMonth() == month) {
                if (date.getDay() === 1) {
                    mondays += 1;
                    day += 7;
                } else {
                    day++;
                }
                date = new Date(year, month, day);
            }
            return mondays;
        };

        var buildCsvContent = function () {
            var csvData = [],
                DELIMITER = ',',
                NEW_LINE = '\n';

            var escapeString = function (string) {
                return '"' + string + '"';
            };

            var addProjectBasicInfo = function() {
                csvData.push([escapeString($scope.resourceBundle.projectInformationLabel)]);

                _.forEach($scope.projectAttributes, function(projectAttribute) {
                    var csvRow = [escapeString(projectAttribute.name), escapeString(projectAttribute.value)].join(DELIMITER);
                    csvData.push(csvRow);
                });
            };

            var addPivotTableData = function () {
                var pivotTablesWithData = _.filter($scope.pivotTables, 'isTableDataAvailable');
                _.forEach(pivotTablesWithData, function (pivotTable) {
                    var headers = [];
                    if(pivotTable.definition.monthlyReport) {
                        _.forEach(pivotTable.data.metaData.pe, function (period) {

                            var month = $scope.resourceBundle[pivotTable.data.metaData.names[period].split(' ')[0]],
                                year = pivotTable.data.metaData.names[period].split(' ')[1],
                                name = _.isUndefined(month) ? pivotTable.data.metaData.names[period] : month + ' ' + year,

                                numberOfISOWeeks = getNumberOfISOWeeksInMonth(period);

                            headers.push([escapeString(name + ' (' + numberOfISOWeeks + $scope.resourceBundle.weeksLabel + ')')]);
                        });
                    } else {
                        _.forEach(pivotTable.data.metaData.pe, function (period) {
                            headers.push(escapeString(pivotTable.data.metaData.names[period]));
                        });
                    }

                    csvData.push([escapeString(pivotTable.definition.title)].concat(headers).join(DELIMITER));

                    var dataDimensionIndex = _.findIndex(pivotTable.data.headers, { name: 'dx' }),
                        periodIndex = _.findIndex(pivotTable.data.headers, { name: 'pe' }),
                        valueIndex = _.findIndex(pivotTable.data.headers, { name: 'value' });

                    _.forEach(pivotTable.currentOrderOfItems, function (itemId) {
                        var values = _.map(pivotTable.data.metaData.pe, function (period) {
                            var row = _.find(pivotTable.data.rows, function (row) {
                                return itemId == row[dataDimensionIndex] && period == row[periodIndex];
                            });
                            return row && row[valueIndex];
                        });
                        csvData.push([escapeString(pivotTable.data.metaData.names[itemId])].concat(values).join(DELIMITER));
                    });
                    csvData.push([]);
                });
            };

            addProjectBasicInfo();
            csvData.push([]);
            addPivotTableData();

            return csvData.join(NEW_LINE);
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
                return pivotTableRepository.getDataForPivotTable(tableDefinition.name, $scope.selectedProject.id).then(function(data) {
                    return {
                        definition: tableDefinition,
                        data: data,
                        isTableDataAvailable: !!(data && data.rows && data.rows.length > 0)
                    };
                });
            }));
        };

        var translatePivotTables = function (pivotTables) {
            return translationsService.translateReports(pivotTables);
        };

        var loadPivotTables = function() {
            return pivotTableRepository.getAll()
                .then(filterProjectReportTables)
                .then(getDataForPivotTables)
                .then(translatePivotTables)
                .then(function(pivotTables) {
                    $scope.pivotTables = pivotTables;
                    $scope.isReportAvailable = _.any(pivotTables, { isTableDataAvailable: true });
                });
        };

        var init = function() {
            $scope.loading = true;
            $q.all([loadProjectBasicInfo(), loadPivotTables()]).finally(function () {
                $scope.loading = false;
            });
        };

        init();
    };

});
