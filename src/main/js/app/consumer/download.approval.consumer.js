    define(["moment", "properties", "lodash", "dateUtils"], function(moment, properties, _, dateUtils) {
        return function(datasetRepository, userPreferenceRepository, orgUnitRepository, $q, approvalService, approvalDataRepository) {

            var getDatasetsForModule = function(moduleId) {
                return orgUnitRepository.findAllByParent([moduleId]).then(function(originOrgUnits) {
                    var moduleAndOriginOrgUnitIds = _.pluck(originOrgUnits, "id").concat(moduleId);
                    return datasetRepository.findAllForOrgUnits(moduleAndOriginOrgUnitIds);
                });
            };

            var getMetadata = function() {
                return $q.all([userPreferenceRepository.getUserModules(), datasetRepository.getAll()]).then(function(data) {
                    var userModuleIds = _.pluck(data[0], "id");
                    var allDataSetIds = _.pluck(data[1], "id");
                    var originOrgUnits = [];

                    if (_.isEmpty(userModuleIds))
                        return [userModuleIds, originOrgUnits, allDataSetIds];

                    return orgUnitRepository.findAllByParent(userModuleIds).then(function(originOrgUnits) {
                        return [userModuleIds, originOrgUnits, allDataSetIds];
                    });
                });
            };

            var getCompletionAndApprovalData = function(metadata) {
                var userModuleIds = metadata[0];
                var originOrgUnits = metadata[1];
                var allDataSetIds = metadata[2];

                if (userModuleIds.length === 0 || allDataSetIds.length === 0)
                    return;

                var m = moment();
                var startPeriod = dateUtils.toDhisFormat(m.isoWeek(m.isoWeek() - properties.projectDataSync.numWeeksToSync + 1));
                var endPeriod = dateUtils.toDhisFormat(moment());

                var getDhisCompletionDataPromise = approvalService.getCompletionData(userModuleIds, originOrgUnits, allDataSetIds);

                var getDhisApprovalDataPromises = _.map(userModuleIds, function(moduleId) {
                    return getDatasetsForModule(moduleId).then(function(datasets) {
                        if (_.isEmpty(datasets)) {
                            return $q.when([]);
                        } else {
                            return approvalService.getApprovalData(moduleId, _.pluck(datasets, "id"));
                        }
                    });
                });

                var getApprovalDataPromise = approvalDataRepository.getApprovalDataForPeriodsOrgUnits(startPeriod, endPeriod, userModuleIds);

                return $q.all([getDhisCompletionDataPromise, $q.all(getDhisApprovalDataPromises), getApprovalDataPromise]);
            };

            var saveCompletionAndApprovalData = function(data) {
                if (!data)
                    return;

                var dhisCompletionList = data[0];
                var dhisApprovalList = _.flatten(data[1]);
                var dbApprovalList = data[2];

                var approvalUpsertPromises = [];

                var mergedDhisCompletionAndApprovalList = _.map(dhisCompletionList, function(dhisCompletionData) {
                    var dhisApprovalData = _.find(dhisApprovalList, _.matches({
                        "period": dhisCompletionData.period,
                        "orgUnit": dhisCompletionData.orgUnit
                    }));
                    if (dhisApprovalData)
                        return _.merge(dhisCompletionData, dhisApprovalData);
                    return dhisCompletionData;
                });

                var newApprovals = _.reject(mergedDhisCompletionAndApprovalList, function(dhisApprovalData) {
                    return _.any(dbApprovalList, {
                        "orgUnit": dhisApprovalData.orgUnit,
                        "period": dhisApprovalData.period
                    });
                });

                if (!_.isEmpty(newApprovals))
                    approvalUpsertPromises.push(approvalDataRepository.saveApprovalsFromDhis(newApprovals));

                _.each(dbApprovalList, function(dbApproval) {
                    if (dbApproval.status === "NEW" || dbApproval.status === "DELETED")
                        return;

                    var dhisApprovalData = _.find(mergedDhisCompletionAndApprovalList, {
                        "orgUnit": dbApproval.orgUnit,
                        "period": dbApproval.period
                    });

                    var l1UpdatePromise = dhisApprovalData ? approvalDataRepository.saveApprovalsFromDhis(dhisApprovalData) : approvalDataRepository.invalidateApproval(dbApproval.period, dbApproval.orgUnit);
                    approvalUpsertPromises.push(l1UpdatePromise);
                });

                return $q.all(approvalUpsertPromises);
            };

            this.run = function() {
                return getMetadata()
                    .then(getCompletionAndApprovalData)
                    .then(saveCompletionAndApprovalData);
            };
        };
    });
