define(["lodash", "md5", "moment", "orgUnitMapper"], function(_, md5, moment, orgUnitMapper) {

    return function($scope, db, orgUnitService, $q, $location, $timeout, $anchorScroll) {

        var scrollToTop = function() {
            $location.hash();
            $anchorScroll();
        };

        $scope.allProjectTypes = ['Direct', 'Indirect', 'Project excluded from TYPO analysis and Coordination'];

        $scope.allContexts = ['Armed conflict', 'Post-conflict'];

        $scope.allConsultDays = ['1', '2', '3', '4', '5', '6', '7'];

        $scope.allPopTypes = ['Displaced', 'General Population', 'Mixed - Displaced/General', 'Victims of Natural Disaster'];

        $scope.thisDate = moment().toDate();

        $scope.openOpeningDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = true;
            $scope.endDate = false;
        };

        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.openingDate = false;
            $scope.endDate = true;
        };

        $scope.reset = function() {
            $scope.newOrgUnit = {
                'openingDate': new Date(),
            };
            $scope.saveFailure = $scope.saveSuccess = false;
        };

        $scope.save = function(newOrgUnit, parentOrgUnit) {
            var onSuccess = function(data) {
                $location.hash(data);
            };

            var onError = function() {
                $scope.saveFailure = true;
            };

            var saveToDb = function() {
                var store = db.objectStore("organisationUnits");
                return store.upsert(payload);
            };

            newOrgUnit = _.merge(newOrgUnit, {
                'id': md5(newOrgUnit.name + parentOrgUnit.name).substr(0, 11),
                'shortName': newOrgUnit.name,
                'level': 4,
                'openingDate': moment(newOrgUnit.openingDate).format("YYYY-MM-DD"),
                'endDate': moment(newOrgUnit.endDate).format("YYYY-MM-DD"),
                'parent': _.pick(parentOrgUnit, "name", "id")
            });

            var payload = orgUnitMapper.toDhisProject(newOrgUnit);

            return orgUnitService.create(payload).then(saveToDb).then(onSuccess, onError);

        };

        var getAttributeValue = function(code) {
            return _.find($scope.orgUnit.attributeValues, {
                'attribute': {
                    'code': code
                }
            }).value;
        };

        var init = function() {
            $scope.reset();
            if (!$scope.isEditMode) {
                $scope.newOrgUnit.name = $scope.orgUnit.name;
                $scope.newOrgUnit.openingDate = $scope.orgUnit.openingDate;
                if ($scope.orgUnit.attributeValues) {
                    $scope.newOrgUnit.location = getAttributeValue('prjLoc');
                    $scope.newOrgUnit.context = getAttributeValue('prjCon');
                    $scope.newOrgUnit.endDate = getAttributeValue('prjEndDate');
                    $scope.newOrgUnit.projectType = getAttributeValue('prjType');
                    $scope.newOrgUnit.populationType = getAttributeValue('prjPopType');
                    $scope.newOrgUnit.consultDays = getAttributeValue('prjConDays');
                }
            }
        };

        init();
    };
});