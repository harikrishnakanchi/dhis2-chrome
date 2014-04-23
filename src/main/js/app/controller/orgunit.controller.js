define(["toTree", "lodash", "md5", "moment"], function(toTree, _, md5, moment) {
    return function($scope, db, projectsService, $q, $location, $timeout, $anchorScroll) {
        var templateUrlMap = {
            'Company': 'templates/partials/project-form.html',
            'Operational Center': 'templates/partials/project-form.html',
            'Country': 'templates/partials/project-form.html',
            'Project': 'templates/partials/project-form.html'
        };

        $scope.organisationUnits = [];

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
        };

        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.endDate = true;
        };

        $scope.maxDate = new Date();

        $scope.reset = function() {
            $scope.newOrgUnit = {
                'openingDate': new Date()
            };
            $scope.saveFailure = $scope.saveSuccess = false;
            $scope.openCreateForm = false;
        };

        var getAll = function(storeName) {
            var store = db.objectStore(storeName);
            return store.getAll();
        };

        var selectCurrentNode = function(transformedOrgUnits) {
            if (!transformedOrgUnits.selectedNode)
                return;

            $scope.state = {
                "currentNode": transformedOrgUnits.selectedNode
            };
            $scope.onOrgUnitSelect(transformedOrgUnits.selectedNode);
            $scope.saveSuccess = true;
            $timeout(function() {
                $scope.saveSuccess = false;
            }, 3000);
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
            $scope.reset();
            var selectedNodeId = $location.hash();
            $q.all([getAll("organisationUnits"), getAll("organisationUnitLevels")]).then(_.curry(transformToTree)(selectedNodeId));
        };

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.onOrgUnitSelect = function(orgUnit) {
            $scope.reset();
            $scope.orgUnit = orgUnit;
            $scope.setTemplateUrl(orgUnit, false);
            scrollToTop();
        };

        $scope.showProjectAttribute = function() {
            return ($scope.orgUnit !== undefined && $scope.orgUnit.level === 3);
        };
        $scope.save = function(orgUnit, parent) {
            orgUnit = _.merge(orgUnit, {
                'id': md5(orgUnit.name + parent.name).substr(0, 11),
                'shortName': orgUnit.name,
                'level': parent.level + 1,
                'openingDate': moment(orgUnit.openingDate).format("YYYY-MM-DD"),
                'parent': _.pick(parent, "name", "id")
            });

            var onSuccess = function(data) {
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

        $scope.getLevel = function(orgUnit, depth) {
            depth = depth || 0;
            var level = orgUnit ? $scope.orgUnitLevelsMap[orgUnit.level + depth] : undefined;
            return level ? level.split("/")[0].trim() : undefined;
        };

        $scope.canCreateChild = function(orgUnit) {
            return _.contains(["Country", "Project", "Operation Unit", "Module"], $scope.getLevel(orgUnit, 1));
        };

        $scope.canCreateMulitpleChildType = function(orgUnit) {
            return $scope.canCreateChild(orgUnit) && $scope.getLevel(orgUnit) === 'Project';
        };

        $scope.setTemplateUrl = function(orgUnit, isEditMode, orgLevel) {
            parentOrgUnit = _.cloneDeep($scope.orgUnit);
            $scope.orgUnit = isEditMode ? {
                'openingDate': new Date()
            } : orgUnit;
            orgLevel = orgLevel || 0;
            var level = $scope.getLevel(orgUnit, orgLevel);
            $scope.templateUrl = templateUrlMap[level];
            $scope.isEditMode = isEditMode;
        };

        init();
    };
});