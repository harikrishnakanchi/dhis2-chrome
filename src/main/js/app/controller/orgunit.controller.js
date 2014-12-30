define(["toTree", "lodash", "moment", "properties"], function(toTree, _, moment, properties) {
    return function($scope, db, $q, $location, $timeout, $anchorScroll) {
        var templateUrlMap = {
            'Company': 'templates/partials/company-form.html',
            'Operational Center': 'templates/partials/oc-form.html',
            'Country': 'templates/partials/country-form.html',
            'Project': 'templates/partials/project-form.html',
            'Module': 'templates/partials/module-form.html',
            'Operation Unit': 'templates/partials/op-unit-form.html',
            'User': 'templates/partials/project-user-form.html'
        };

        $scope.organisationUnits = [];

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var selectCurrentNode = function(transformedOrgUnits) {
            if (!transformedOrgUnits.selectedNode) return;
            $scope.state = {
                "currentNode": transformedOrgUnits.selectedNode
            };
            $scope.saveSuccess = true;
            $scope.onOrgUnitSelect(transformedOrgUnits.selectedNode);
            $timeout(function() {
                $scope.saveSuccess = false;
            }, properties.messageTimeout);
        };

        var transformToTree = function(nodeToBeSelected, args) {
            var orgUnits = args[0];
            $scope.orgUnitLevelsMap = _.transform(args[1], function(result, orgUnit) {
                result[orgUnit.level] = orgUnit.name;
            }, {});
            var transformedOrgUnits = toTree(orgUnits, nodeToBeSelected);
            $scope.organisationUnits = transformedOrgUnits.rootNodes;
            selectCurrentNode(transformedOrgUnits);
        };

        var init = function() {
            var selectedNodeId = $location.hash()[0];
            var message = $location.hash()[1];
            $q.all([getAll("organisationUnits"), getAll("organisationUnitLevels")]).then(_.curry(transformToTree)(selectedNodeId));
        };

        $scope.closeNewForm = function(selectedNode, message) {
            if (message) {
                $scope.showMessage = true;
                $scope.message = message;
                $timeout(function() {
                    $scope.showMessage = false;
                }, properties.messageTimeout);
            }
            $q.all([getAll("organisationUnits"), getAll("organisationUnitLevels")]).then(_.curry(transformToTree)(selectedNode.id));
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.getOrgUnitType = function(orgUnit) {
            if (!_.isEmpty(orgUnit)) {
                return _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": "Type"
                    }
                }).value;
            }
        };

        $scope.onOrgUnitSelect = function(orgUnit) {
            $scope.orgUnit = orgUnit;
            $scope.openInViewMode($scope.getOrgUnitType(orgUnit));
            scrollToTop();
        };

        $scope.openInNewMode = function(type) {
            $scope.templateUrl = templateUrlMap[type] + '?' + moment().format("X");
            $scope.isNewMode = true;
        };

        $scope.openInViewMode = function(type) {
            $scope.templateUrl = templateUrlMap[type] + '?' + moment().format("X");
            $scope.isNewMode = false;
        };

        init();
    };
});
