define(["lodash", "moment"], function(_, moment) {
    return function(reportService, pivotTableRepository, userPreferenceRepository, datasetRepository, changeLogRepository, $q) {

        this.run = function(message) {

            var getLastDownloadedTime = function(userProjectIds) {
                return changeLogRepository.get("reports:" + userProjectIds.join(';'));
            };

            var updateChangeLog = function(userProjectIds) {
                return changeLogRepository.clear("reports:").then(function() {
                    return changeLogRepository.upsert("reports:" + userProjectIds.join(';'), moment().toISOString());
                });
            };

            var loadUserProjectsAndModuleIds = function() {
                return $q.all([userPreferenceRepository.getCurrentProjects(), userPreferenceRepository.getUserModules(), userPreferenceRepository.getOriginOrgUnitIds()]);
            };

            var loadRelevantDatasets = function(orgUnitIds) {
                return datasetRepository.findAllForOrgUnits(orgUnitIds);
            };

            var downloadAndSavePivotTableData = function(userModuleIds, datasets, projectIds) {

                var savePivotTables = function(pivotTables) {
                    return pivotTableRepository.replaceAll(pivotTables).then(function(data) {
                        return pivotTables;
                    });
                };

                var savePivotTableData = function(pivotTables) {

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

                    var getDatasetCodesByModule = function() {
                        var promises = [];

                        _.forEach(userModuleIds, function(userModuleId) {
                            promises.push(datasetRepository.findAllForOrgUnits([userModuleId]));
                        });

                        return $q.all(promises).then(function(datasets) {
                            var datasetCodesByModule = {};
                            _.forEach(userModuleIds, function(userModuleId, index) {
                                datasetCodesByModule[userModuleId] = _.pluck(datasets[index], 'code');
                            });
                            return datasetCodesByModule;
                        });
                    };

                    var filterPivotTablesForModules = function(datasetCodesByModule) {
                        var modulesAndPivotTables = [];
                        _.forEach(userModuleIds, function(userModule) {
                            _.forEach(pivotTables, function(pivotTable) {
                                _.forEach(datasetCodesByModule[userModule], function(datasetCode) {
                                    if (_.contains(pivotTable.name, datasetCode))
                                        modulesAndPivotTables.push([userModule, pivotTable]);
                                });
                            });
                        });
                        return $q.when(modulesAndPivotTables);
                    };

                    return getDatasetCodesByModule()
                        .then(filterPivotTablesForModules)
                        .then(downloadAndUpsertPivotTableData)
                        .then(function() {
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
