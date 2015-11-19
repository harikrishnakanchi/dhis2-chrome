define(["lodash", "moment"], function(_, moment) {
    return function(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, $q) {

        this.run = function(message) {

            var getLastDownloadedTime = function(userProjectIds) {
                return changeLogRepository.get("reports:" + userProjectIds.join(';'));
            };

            var updateChangeLog = function(userProjectIds) {
                return changeLogRepository.upsert("reports:" + userProjectIds.join(';'), moment().toISOString());
            };

            var loadUserProjectsAndModuleIds = function() {
                return $q.all([userPreferenceRepository.getCurrentProjects(), userPreferenceRepository.getUserModules(), userPreferenceRepository.getOriginOrgUnitIds()]);
            };

            var loadRelevantDatasets = function(orgUnitIds) {
                return datasetRepository.findAllForOrgUnits(orgUnitIds);
            };

            var downloadAndSavePivotTableData = function(userModuleIds, datasets, projectIds) {

                var savePivotTables = function(pivotTables) {
                    return pivotTableRepository.upsert(pivotTables).then(function(data) {
                        return pivotTables;
                    });
                };

                var savePivotTableData = function(pivotTables) {
                    var modulesAndTables = [];
                    var downloadOfAtLeastOneReportFailed = false;

                    var downloadAndUpsertPivotTableData = function(modulesAndTables) {

                        var onSuccess = function(data) {
                            return pivotTableRepository.upsertPivotTableData(datum[1].name, datum[0], data).then(function() {
                                return downloadAndUpsertPivotTableData(modulesAndTables);
                            });
                        };

                        var onFailure = function() {
                            downloadOfAtLeastOneReportFailed = true;
                            return downloadAndUpsertPivotTableData(modulesAndTables);
                        };

                        if (_.isEmpty(modulesAndTables))
                            return $q.when({});

                        var datum = modulesAndTables.pop();

                        return reportService.getReportDataForOrgUnit(datum[1], datum[0]).then(onSuccess, onFailure);
                    };

                    _.forEach(userModuleIds, function(userModule) {
                        _.forEach(pivotTables, function(pivotTable) {
                            modulesAndTables.push([userModule, pivotTable]);
                        });
                    });

                    return downloadAndUpsertPivotTableData(modulesAndTables).then(function() {
                        if (!downloadOfAtLeastOneReportFailed) {
                            return updateChangeLog(projectIds);
                        }
                    });

                };

                return reportService.getPivotTables(datasets)
                    .then(savePivotTables)
                    .then(savePivotTableData);
            };

            return loadUserProjectsAndModuleIds().then(function(data) {
                var projectIds = data[0];
                var moduleIds = _.pluck(data[1], "id");
                var originIds = data[2];

                if (_.isEmpty(moduleIds))
                    return;

                return getLastDownloadedTime(projectIds).then(function(lastDownloadedTime) {
                    if (lastDownloadedTime && !moment().isAfter(lastDownloadedTime, 'day')) {
                        return;
                    }
                    return loadRelevantDatasets(_.union(moduleIds, originIds)).then(function(datasets) {
                        return downloadAndSavePivotTableData(moduleIds, datasets, projectIds);
                    });

                });

            });
        };
    };
});
