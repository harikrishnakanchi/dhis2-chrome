define(["moment", "lodash"], function(moment, _) {

    return function($rootScope, $scope, orgUnitRepository) {
        var selectedProject = $rootScope.currentUser.selectedProject;
        $scope.projectName = selectedProject.name;

        orgUnitRepository.get(selectedProject.id).then(function(projectInfo) {
            $scope.projectAttributes = parseProjectAttributes(projectInfo);
        });

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
    };

});
