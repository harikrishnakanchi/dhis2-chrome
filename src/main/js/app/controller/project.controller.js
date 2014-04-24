define(["toTree", "lodash", "md5", "moment"], function(toTree, _, md5, moment) {

    return function($scope, db, projectsService, $q, $location, $timeout, $anchorScroll) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

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

        $scope.reset = function() {
            $scope.newOrgUnit = {
                'openingDate': new Date(),
            };
            $scope.saveFailure = $scope.saveSuccess = false;
            $scope.openCreateForm = false;
        };

        var init = function() {
            if (!$scope.isEditMode) {
                $scope.newOrgUnit.name = $scope.orgUnit.name;
                $scope.newOrgUnit.openingDate = $scope.orgUnit.openingDate;
                $scope.newOrgUnit.location = _.find($scope.orgUnit.attributeValues, {
                    'attribute': {
                        'code': 'prjLoc'
                    }
                }).value;
                $scope.newOrgUnit.context = _.find($scope.orgUnit.attributeValues, {
                    'attribute': {
                        'code': 'prjCon'
                    }
                }).value;
                $scope.newOrgUnit.endDate = _.find($scope.orgUnit.attributeValues, {
                    'attribute': {
                        'code': 'prjEndDate'
                    }
                }).value;
                $scope.newOrgUnit.projectType = _.find($scope.orgUnit.attributeValues, {
                    'attribute': {
                        'code': 'prjType'
                    }
                }).value;
                $scope.newOrgUnit.populationType = _.find($scope.orgUnit.attributeValues, {
                    'attribute': {
                        'code': 'prjPopType'
                    }
                }).value;
                $scope.newOrgUnit.consultDays = _.find($scope.orgUnit.attributeValues, {
                    'attribute': {
                        'code': 'prjConDays'
                    }
                }).value;
            }
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            newOrgUnit = _.merge(newOrgUnit, {
                'id': md5(newOrgUnit.name + parentOrgUnit.name).substr(0, 11),
                'shortName': newOrgUnit.name,
                'level': 4,
                'openingDate': moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                'endDate': moment(newOrgUnit.endDate).format("YYYY-MM-DD"),
                'parent': _.pick(parentOrgUnit, "name", "id")
            });

            var onSuccess = function(data) {
                $location.hash(data);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert(newOrgUnit);
            };

            return projectsService.create([newOrgUnit]).then(saveToDb).then(onSuccess, onError);

        };
        init();
    };
});