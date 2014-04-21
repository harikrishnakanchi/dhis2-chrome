define(["toTree", "lodash", "md5"], function(toTree, _, md5) {
    return function($scope, db, projectsService, $q, $location) {
        $scope.organisationUnits = [];

        $scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
        };

        $scope.maxDate = new Date();

        $scope.reset = function() {
            $scope.newOrgUnit = {
                'openingDate': new Date()
            };
            $scope.openCreateForm = false;
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var transformToTree = function(nodeToBeSelected, args) {
            var orgUnits = args[0];
            $scope.orgUnitLevelsMap = _.transform(args[1], function(result, orgUnit) {
                result[orgUnit.level] = orgUnit.name;
            }, {});
            var transformedOrgUnits = toTree(orgUnits, nodeToBeSelected);
            $scope.organisationUnits = transformedOrgUnits.rootNodes;
            if (transformedOrgUnits.selectedNode) {
                $scope.state = {
                    "currentNode": transformedOrgUnits.selectedNode
                };
                $scope.onOrgUnitSelect(transformedOrgUnits.selectedNode);
            }
        };

        var init = function() {
            $scope.reset();
            var selectedNodeId = $location.hash();
            $q.all([getAll("organisationUnits"), getAll("organisationUnitLevels")]).then(_.curry(transformToTree)(selectedNodeId));
        };

        $scope.onOrgUnitSelect = function(orgUnit) {
            $scope.reset();
            $scope.saveSuccess = $scope.saveFailure = false;
            $scope.orgUnit = orgUnit;
        };

        $scope.save = function(orgUnit, parent) {
            orgUnit = _.merge(orgUnit, {
                'id': md5(orgUnit.name + parent.name).substr(0, 11),
                'shortName': orgUnit.name,
                'level': parent.level + 1,
                'parent': _.pick(parent, "name", "id")
            });

            var onSuccess = function(data) {
                $scope.saveSuccess = true;
                $scope.openCreateForm = false;
                $location.hash(data);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert(orgUnit);
            };

            return projectsService.create(orgUnit).then(saveToDb).then(onSuccess, onError);

        };

        $scope.getNextLevel = function(orgUnit) {
            return orgUnit ? $scope.orgUnitLevelsMap[orgUnit.level + 1] : undefined;
        };

        $scope.canCreateChild = function(orgUnit) {
            return _.contains(["Country", "Project"], $scope.getNextLevel(orgUnit));
        };

        init();
    };
});