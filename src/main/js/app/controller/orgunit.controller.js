define(["toTree", "lodash", "moment", "properties"], function(toTree, _, moment, properties) {
    return function($scope, $q, $location, $timeout, $anchorScroll, $rootScope, orgUnitRepository) {

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

        $scope.organisationUnits = [];


        var isSuperAdmin = function() {
            return $rootScope.currentUser.userCredentials.username === "superadmin";
        };

        var isProjectAdmin = function() {
            return $rootScope.currentUser.userCredentials.username === "projectadmin";
        };

        var getUserSelectedProjectId = function() {
            if($rootScope.currentUser.selectedProject)
                return $rootScope.currentUser.selectedProject.id;
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

        var reloadTree = function(selectedNodeId) {

            var transformToTree = function(orgUnits) {
                var transformedOrgUnits = toTree(orgUnits, selectedNodeId);
                $scope.organisationUnits = transformedOrgUnits.rootNodes;
                selectCurrentNode(transformedOrgUnits);
            };

            var getOrgUnits = function() {
                if (isSuperAdmin() && $rootScope.productKeyLevel == "global")
                    return orgUnitRepository.getOrgUnitAndDescendants(4);

                if (isSuperAdmin() && $rootScope.productKeyLevel == "country") {
                    var countryId = $rootScope.allowedOrgUnits[0].id;
                    return orgUnitRepository.getOrgUnitAndDescendants(4, countryId);
                }

                if (isProjectAdmin()) {
                    var orgUnitId = getUserSelectedProjectId();
                    return orgUnitRepository.getOrgUnitAndDescendants(6, orgUnitId);
                }
                return $q.when([]);
            };

            return getOrgUnits().then(transformToTree);
        };

        var init = function() {
            var getAllAllowedOrgunitIds = function() {
                return _.flatten(_.union(_.pluck($rootScope.allowedOrgUnits[0].children,"id"), _.pluck($rootScope.allowedOrgUnits, "id")));
            };

            var isGlobalProductKey = function() {
                return $rootScope.productKeyLevel == "global";
            };

            var isSelectedProjectInAllowedOrgUnits = function() {
                if (_.isUndefined($rootScope.currentUser.selectedProject) || isGlobalProductKey())
                    return true;

                return !_.contains(getAllAllowedOrgunitIds(), getUserSelectedProjectId());
            };

            if (isProjectAdmin() && isSelectedProjectInAllowedOrgUnits()) {
                $location.path("/selectProjectPreference");
                return;
            }

            var selectedNodeId = $location.hash()[0];

            reloadTree(selectedNodeId);
        };

        $scope.closeNewForm = function(selectedNode, message) {

            if (message) {
                $scope.showMessage = true;
                $scope.message = message;
                $timeout(function() {
                    $scope.showMessage = false;
                }, properties.messageTimeout);
            }

            reloadTree(selectedNode.id);
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
