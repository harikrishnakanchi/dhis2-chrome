define(["moment", "lodash"], function(moment, _) {
    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository, translationsService) {
        $scope.selectedProject = $rootScope.currentUser.selectedProject;

        $scope.getCsvFileName = function() {
          return $scope.selectedProject.name + "_ProjectReport_"+  moment().format("DD-MMM-YYYY") + ".csv";
        };

        $scope.getCsvFileData = function() {
            var data = [];

            var addProjectBasicInfo = function() {
                data.push([$scope.resourceBundle.projectInformationLabel]);

                _.forEach($scope.projectAttributes, function(projectAttribute) {
                    data.push([projectAttribute.name, projectAttribute.value]);
                });
            };

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

            var addPivotTablesData = function() {
                _.forEach($scope.pivotTables, function(pivotTable) {
                    var headers = [];
                    if(pivotTable.isTableDataAvailable) {
                        if(pivotTable.definition.monthlyReport) {
                            _.forEach(pivotTable.data.metaData.pe, function (period) {
                                var numberofWeeks = getNumberOfISOWeeksInMonth(period);
                                headers.push([pivotTable.data.metaData.names[period] + " (" + numberofWeeks + " weeks)"]);
                            });
                        } else {
                            _.forEach(pivotTable.data.metaData.pe, function (period) {
                                headers.push([pivotTable.data.metaData.names[period]]);
                            });
                        }

                        data.push([pivotTable.definition.title].concat(headers));

                        var dataDimensionIndex = _.findIndex(pivotTable.data.headers, {
                            "name": "dx"
                        });
                        var periodIndex = _.findIndex(pivotTable.data.headers, {
                            "name": "pe"
                        });
                        var valueIndex = _.findIndex(pivotTable.data.headers, {
                            "name": "value"
                        });

                        _.forEach(pivotTable.currentOrderOfItems, function (itemId) {
                            var values = [];
                            _.forEach(pivotTable.data.metaData.pe, function (period) {
                                var value = _.find(pivotTable.data.rows, function (row) {
                                    return itemId == row[dataDimensionIndex] && period == row[periodIndex];
                                });

                                if (!_.isUndefined(value))
                                    values.push(value[valueIndex]);
                                else
                                    values.push(undefined);
                            });
                            data.push([pivotTable.data.metaData.names[itemId]].concat(values));
                        });
                        data.push([]);
                    }
                });
            };

            addProjectBasicInfo();
            data.push([]);
            addPivotTablesData();

            return data;

        };

        var parseProjectAttributes = function(projectInfo) {
            var attributeNames = ["Project Code", "Project Type", "Context", "Type of population", "Reason For Intervention", "Mode Of Operation", "Model Of Management"];
            var attributeInfo, projectAttribute;

            var getAttributeInfo = function(attributeName) {
                return _.find(projectInfo.attributeValues, {
                    "attribute": {
                        "name": attributeName
                    }
                });
            };

            var projectAttributes = [{name: "Country", value: projectInfo.parent.name}];
            projectAttributes.push({name: "Name", value: projectInfo.name});
            attributeNames.forEach(function(attributeName) {
                attributeInfo = getAttributeInfo(attributeName);
                projectAttribute = {
                    name: attributeName,
                    value: attributeInfo && attributeInfo.value || ""
                };
                projectAttributes.push(projectAttribute);
            });

            projectAttributes.push({name: "Opening Date", value: moment(projectInfo.openingDate).toDate().toLocaleDateString()});
            projectAttributes.push({name: "End Date", value: getAttributeInfo("End date") ? moment(getAttributeInfo("End date").value).toDate().toLocaleDateString() : ""});
            return projectAttributes;
        };

        var loadProjectBasicInfo = function() {
            return orgUnitRepository.get($scope.selectedProject.id).then(function(projectInfo) {
                $scope.projectAttributes = parseProjectAttributes(projectInfo);
            });
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
            return $q.when(translationsService.translateReports(pivotTables));
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
