define([], function() {

    return function($rootScope, $scope, orgUnitRepository) {
        var selectedProject = $rootScope.currentUser.selectedProject;
        $scope.projectName = selectedProject.name;

        orgUnitRepository.get(selectedProject.id).then(function(projectInfo) {
            $scope.projectAttributes = parseProjectAttributes(projectInfo);
        });

        var parseProjectAttributes = function(projectInfo) {
            var filteredResult = _.filter(projectInfo.attributeValues, function (attributeInfo) {
                return _.contains(["prjCon", "projCode", "modeOfOperation", "projectType", "modelOfManagement", "prjPopType", "reasonForIntervention"], attributeInfo.attribute.code);
            });
            var projectAttributes = [{name: "Country", value: projectInfo.parent.name}];
            projectAttributes.push({name: "Name", value: projectInfo.name});
            projectAttributes.push({name: "Opening Date", value: projectInfo.openingDate});
            projectAttributes.push(_.map(filteredResult, function (attributeInfo) {
                    return {
                        name: attributeInfo.attribute.name,
                        value: attributeInfo.value
                    };
                }
            ));
            return _.flatten(projectAttributes);
        };
    };

});
