define(['mergeByUnion', 'lodashUtils'], function(mergeByUnion, _) {
    return function(datasetService, datasetRepository, $q) {
        this.run = function(message) {
            return download().then(mergeAll);
        };

        var download = function() {
            return datasetService.getAll();
        };

        var mergeAll = function(remoteDatasets) {
            return $q.all(_.map(remoteDatasets, function(ds) {
                return datasetRepository.get(ds.id)
                    .then(_.curry(mergeByUnion)("organisationUnits", ds))
                    .then(function(mergedDataset) {
                        return mergedDataset ? datasetRepository.upsert(mergedDataset) : $q.when([]);
                    });
            }));
        };
    };
});
