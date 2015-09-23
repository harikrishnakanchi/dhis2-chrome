define(["toTree", "lodash", "moment", "properties"], function(toTree, _, moment, properties) {
    return function($scope, db, $q, $location, $timeout, $anchorScroll, $rootScope, orgUnitRepository) {
        var templateUrlMap = {
            'Company': 'templates/partials/company-form.html',
            'Operational Center': 'templates/partials/oc-form.html',
            'Country': 'templates/partials/country-form.html',
            'Project': 'templates/partials/project-form.html',
            'Module': 'templates/partials/module-form.html',
            'LineListModule': 'templates/partials/linelist-module-form.html',
            'Operation Unit': 'templates/partials/op-unit-form.html',
            'User': 'templates/partials/project-user-form.html',
            'Patient Origin': 'templates/partials/patient-origin-form.html',
            'Referral Locations': 'templates/partials/referral-locations-form.html'
        };

        var isMsfAdmin = $rootScope.currentUser.userCredentials.username === "msfadmin";

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
            var orgUnits = _.flatten(args[0]);
            orgUnits = _.filter(orgUnits, function(ou) {
                return ou.level < 7;
            });

            $scope.orgUnitLevelsMap = _.transform(args[1], function(result, orgUnit) {
                result[orgUnit.level] = orgUnit.name;
            }, {});

            var transformedOrgUnits = isMsfAdmin ? toTree(orgUnits, nodeToBeSelected, true) : toTree(orgUnits, nodeToBeSelected, true);
            $scope.organisationUnits = transformedOrgUnits.rootNodes;
            selectCurrentNode(transformedOrgUnits);
        };

        var getOrgUnits = function() {
            if (isMsfAdmin) {
                return orgUnitRepository.getAllOrgUnitsUnderProject($rootScope.currentUser.selectedProject);
            } else
                return orgUnitRepository.getAll();
        };

        var init = function() {
            var selectedNodeId = $location.hash()[0];
            var message = $location.hash()[1];
            $q.all([getOrgUnits(), getAll("organisationUnitLevels")]).then(_.curry(transformToTree)(selectedNodeId));
        };

        $scope.closeNewForm = function(selectedNode, message) {
            if (message) {
                $scope.showMessage = true;
                $scope.message = message;
                $timeout(function() {
                    $scope.showMessage = false;
                }, properties.messageTimeout);
            }
            $q.all([getOrgUnits(), getAll("organisationUnitLevels")]).then(_.curry(transformToTree)(selectedNode.id));
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.getOrgUnitType = function(orgUnit) {
            var isLineListService = function() {
                var attr = _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": "isLineListService"
                    }
                });
                return attr && attr.value == "true";
            };

            if (!_.isEmpty(orgUnit)) {
                var type = _.find(orgUnit.attributeValues, {
                    "attribute": {
                        "code": "Type"
                    }
                }).value;

                if (type == "Module") {
                    type = isLineListService() ? "LineListModule" : "Module";
                }
                return type;
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
