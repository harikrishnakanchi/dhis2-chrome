define(["moment", "lodash"], function(moment, _) {

    return function($rootScope, $q, $scope, orgUnitRepository, pivotTableRepository) {
        var selectedProject = $rootScope.currentUser.selectedProject;
        $scope.projectName = selectedProject.name;

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

            var projectAttributes = [{name: "Country", value: projectInfo.parent.name}];
            projectAttributes.push({name: "Name", value: projectInfo.name});
            attributeNames.forEach(function(attributeName) {
                attributeInfo = _.find(projectInfo.attributeValues, {
                    "attribute": {
                        "name": attributeName
                    }
                });
                projectAttribute = {
                    name: attributeName,
                    value: attributeInfo && attributeInfo.value || ""
                };
                projectAttributes.push(projectAttribute);
            });

            projectAttributes.push({name: "Opening Date", value: moment(projectInfo.openingDate).format("MM/DD/YYYY")});
            projectAttributes.push({name: "End Date", value: (projectInfo.endDate && moment(projectInfo.endDate).format("MM/DD/YYYY")) || ""});
            return projectAttributes;
        };

        var loadProjectBasicInfo = function() {
            orgUnitRepository.get(selectedProject.id).then(function(projectInfo) {
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
                        'data': data
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
          loadProjectBasicInfo();
          loadPivotTables();
        };

        init();
    };

});
