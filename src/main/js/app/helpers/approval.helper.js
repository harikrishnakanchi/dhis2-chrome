define(["properties", "datasetTransformer", "moment"], function(properties, datasetTransformer, moment) {
    return function($hustle, $q, $rootScope, orgUnitRepository, dataSetRepository, approvalDataRepository, dataRepository) {
        var approveData = function(approvalData, approvalFn, approvalType) {
            var saveToDhis = function() {
                return $hustle.publish({
                    "data": approvalData,
                    "type": approvalType
                }, "dataValues");
            };

            return approvalFn(approvalData).then(saveToDhis);
        };

        var markDataAsComplete = function(data) {
            var dataForApproval = {
                "dataSets": data.dataSets,
                "period": data.period,
                "orgUnit": data.orgUnit,
                "storedBy": data.storedBy,
                "date": moment().toISOString(),
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelOneApproval, "uploadCompletionData").then(function() {
                return data;
            });
        };

        var markDataAsApproved = function(data) {
            var dataForApproval = {
                "dataSets": data.dataSets,
                "period": data.period,
                "orgUnit": data.orgUnit,
                "createdByUsername": data.storedBy,
                "createdDate": moment().toISOString(),
                "isApproved": true,
                "status": "NEW"
            };

            return approveData(dataForApproval, approvalDataRepository.saveLevelTwoApproval, "uploadApprovalData");
        };

        var autoApproveExistingData = function(orgUnit) {
            var orgUnitId = orgUnit.id;

            var getSubmittedPeriodsForProject = function(orgUnitId) {
                var m = moment();
                var endPeriod = m.year() + "W" + m.isoWeek();

                m = m.subtract(properties.weeksForAutoApprove, 'week');
                var startPeriod = m.year() + "W" + m.isoWeek();

                var filterDraftData = function(data) {
                    return _.filter(data, function(datum) {
                        return datum.dataValues[0].isDraft != true;
                    });
                };

                return orgUnitRepository.getAllModulesInProjects([orgUnitId], false).then(function(modules) {
                    return dataRepository.getDataValuesForPeriodsOrgUnits(startPeriod, endPeriod, _.pluck(modules, "id")).then(function(data) {
                        data = filterDraftData(data);
                        var dataValuesByOrgUnit = _.groupBy(data, 'orgUnit');
                        return _.map(_.keys(dataValuesByOrgUnit), function(orgUnitId) {
                            return {
                                "orgUnitId": orgUnitId,
                                "period": _.pluck(dataValuesByOrgUnit[orgUnitId], "period")
                            };
                        });
                    });
                });
            };

            var generateApprovalData = function(data) {
                var submittedPeriodsPerProject = data[0];
                var allDatasets = data[1];
                var orgUnitsToApprove = _.pluck(submittedPeriodsPerProject, "orgUnitId");

                return _.map(orgUnitsToApprove, function(orgUnitId, i) {
                    var associatedDatasets = _.pluck(datasetTransformer.getAssociatedDatasets(orgUnitId, allDatasets), 'id');
                    return _.map(submittedPeriodsPerProject[i].period, function(pe) {
                        return approvalData = {
                            "dataSets": associatedDatasets,
                            "period": pe,
                            "orgUnit": orgUnitId,
                            "storedBy": $rootScope.currentUser.userCredentials.username
                        };
                    });
                });
            };

            var autoApprove = function(data) {
                data = _.flatten(data);
                return $q.all(_.map(data, function(datum) {
                    return markDataAsComplete(datum).then(markDataAsApproved);
                }));
            };

            return $q.all([getSubmittedPeriodsForProject(orgUnitId), dataSetRepository.getAll()])
                .then(generateApprovalData)
                .then(autoApprove)
                .then(function(data) {
                    console.log(data);
                });
        };

        return {
            "markDataAsComplete": markDataAsComplete,
            "markDataAsApproved": markDataAsApproved,
            "autoApproveExistingData": autoApproveExistingData
        };
    };
});