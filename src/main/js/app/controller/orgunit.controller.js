define(["toTree", "lodash", "moment", "properties"], function(toTree, _, moment, properties) {
    return function($scope, $q, $location, $timeout, $anchorScroll, $rootScope, orgUnitRepository) {

        var userIsProjectAdmin,
            userIsSuperAdmin,
            templateUrlMap = {
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
                if (userIsSuperAdmin && $rootScope.productKeyLevel == "global")
                    return orgUnitRepository.getOrgUnitAndDescendants(4);

                if (userIsSuperAdmin && $rootScope.productKeyLevel == "country") {
                    var countryId = $rootScope.allowedOrgUnits[0].id;
                    return orgUnitRepository.getOrgUnitAndDescendants(4, countryId);
                }

                if (userIsProjectAdmin) {
                    var orgUnitId = getUserSelectedProjectId();
                    return orgUnitRepository.getOrgUnitAndDescendants(6, orgUnitId);
                }
                return $q.when([]);
            };

            return getOrgUnits().then(transformToTree);
        };

        var init = function() {
            var userHasNotSelectedProject = _.isUndefined($rootScope.currentUser.selectedProject),
                productKeyIsGlobal = $rootScope.productKeyLevel == "global";
            userIsSuperAdmin = $rootScope.currentUser.userCredentials.username === "superadmin";
            userIsProjectAdmin = $rootScope.currentUser.userCredentials.username === "projectadmin";

            var getAllAllowedOrgunitIds = function() {
                var allowedOrgUnitIds = _.pluck($rootScope.allowedOrgUnits, 'id');
                if($rootScope.productKeyLevel == "country") {
                    return orgUnitRepository.findAllByParent(allowedOrgUnitIds).then(function(childOrgUnits) {
                        var childOrgUnitIds = _.pluck(childOrgUnits, 'id');
                        return _.union(allowedOrgUnitIds, childOrgUnitIds);
                    });
                } else {
                    return $q.when(allowedOrgUnitIds);
                }
            };

            var initializeTree = function() {
                var selectedNodeId = $location.hash()[0];
                reloadTree(selectedNodeId);
            };

            var checkIfUserNeedsToSelectProject = function() {
                if(userHasNotSelectedProject) {
                    return $q.when(true);
                } else if(productKeyIsGlobal) {
                    return $q.when(false);
                } else {
                    return getAllAllowedOrgunitIds().then(function(allowedOrgUnitIds) {
                        return !_.contains(allowedOrgUnitIds, getUserSelectedProjectId());
                    });
                }
            };

            if (userIsProjectAdmin) {
                return checkIfUserNeedsToSelectProject().then(function(shouldRedirect) {
                    if(shouldRedirect) {
                        $location.path("/selectProjectPreference");
                    } else {
                        initializeTree();
                    }
                });
            } else {
                initializeTree();
            }
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
            $scope.templateUrl = templateUrlMap[type];
            $scope.isNewMode = true;
        };

        $scope.openInViewMode = function(type) {
            $scope.templateUrl = templateUrlMap[type];
            $scope.isNewMode = false;
        };

        init();
    };
});
