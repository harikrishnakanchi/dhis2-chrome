define(['mergeByUnion', 'lodashUtils', "mergeByLastUpdated"], function(mergeByUnion, _, mergeByLastUpdated) {
    return function(datasetService, datasetRepository, $q) {
        this.run = function(message) {
            return download().then(mergeAll);
        };

        var download = function() {
            return datasetService.getAll();
        };

        var mergeAll = function(remoteDatasets) {
            return $q.all(_.map(remoteDatasets, function(remoteDataset) {
                return datasetRepository.get(remoteDataset.id).then(function(datasetFromIdb) {
                    var mergedDataset = mergeByLastUpdated(remoteDataset, datasetFromIdb);

                    var mergedOrgUnits = mergeByUnion("organisationUnits", remoteDataset, datasetFromIdb);
                    if (mergedOrgUnits) {
                        mergedDataset = mergedDataset || remoteDataset;
                        mergedDataset.organisationUnits = mergedOrgUnits.organisationUnits;
                    }

                    if (mergedDataset)
                        return datasetRepository.upsert(mergedDataset);

                    return $q.when({});
                });
            }));
        };
    };
});
