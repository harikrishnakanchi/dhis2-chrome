define(["moment", "lodash"], function(moment, _) {

    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository) {
        var selectedProject = $rootScope.currentUser.selectedProject;
        $scope.projectName = selectedProject.name;

        $scope.getCsvFileName = function() {
          return $scope.projectName + "_ProjectReport_"+  moment().format("DD-MMM-YYYY") + ".csv";
        };

        $scope.getData = function() {
            var data = [];

            var addProjectBasicInfo = function() {
                data.push([$scope.resourceBundle.projectInformationLabel]);

                _.forEach($scope.projectAttributes, function(projectAttribute) {
                    data.push([projectAttribute.name, projectAttribute.value]);
                });
            };

            var addPivotTablesData = function() {
                _.forEach($scope.pivotTables, function(pivotTable) {
                    var headers = [];
                    if(pivotTable.isTableDataAvailable) {
                        _.forEach(pivotTable.data.metaData.pe, function (period) {
                            headers.push([pivotTable.data.metaData.names[period]]);
                        });

                        data.push([$scope.getTableName(pivotTable.table.name)].concat(headers));

                        var dataDimensionIndex = _.findIndex(pivotTable.data.headers, {
                            "name": "dx"
                        });
                        var periodIndex = _.findIndex(pivotTable.data.headers, {
                            "name": "pe"
                        });
                        var valueIndex = _.findIndex(pivotTable.data.headers, {
                            "name": "value"
                        });

                        _.forEach(pivotTable.dataDimensionItems, function (itemId) {
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

        $scope.getTableName = function(tableName) {
            var regex = /^\[FieldApp - ([a-zA-Z0-9()><]+)\]([0-9\s]*)([a-zA-Z0-9-\s]+)/;
            var match = regex.exec(tableName);
            if (match) {
                var parsedTableName = match[3];
                return parsedTableName;
            } else {
                return "";
            }
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

            projectAttributes.push({name: "Opening Date", value: moment(projectInfo.openingDate).format("MM/DD/YYYY")});
            projectAttributes.push({name: "End Date", value: getAttributeInfo("End date") ? moment(getAttributeInfo("End date").value).format("MM/DD/YYYY") : ""});
            return projectAttributes;
        };

        var loadProjectBasicInfo = function() {
            return orgUnitRepository.get(selectedProject.id).then(function(projectInfo) {
                $scope.projectAttributes = parseProjectAttributes(projectInfo);
            });
        };

        var getProjectReportTables = function(tables) {
            var projectReportTable = [];
            tables.forEach(function(table) {
               if(_.contains(table.name, "ProjectReport"))
                   projectReportTable.push(table);
            });
            return $q.when(projectReportTable);
        };

        var transformTables = function(tables) {
            return $q.all(_.map(tables, function(table) {
                return pivotTableRepository.getDataForPivotTable(table.name, selectedProject.id).then(function(data) {
                    return {
                        'table': table,
                        'data': data,
                        'isTableDataAvailable' : (data && data.rows.length !== 0) ? true : false
                    };
                });
            }));
        };
        var loadPivotTables = function() {
            return pivotTableRepository.getAll()
                .then(getProjectReportTables)
                .then(transformTables)
                .then(function(pivotTables) {
                    $scope.isReportAvailable = _.any(pivotTables, function(table) {
                        if (table.data && table.data.rows)
                            return table.data.rows.length !== 0;
                        return false;
                    });
                    $scope.pivotTables = pivotTables;
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
