define(['moment', "lodashUtils"], function(moment, _) {
    return function(datasetService, datasetRepository, $q) {

        this.run = function(message) {
            return download().then(mergeAll);
        };

        var download = function() {
            return datasetService.getAll();
        };

        var mergeAll = function(remoteDatasets) {
            var isDhisDatasetNewer = function(remoteDataset, localDataset) {
                return moment(remoteDataset.lastUpdated).isAfter(moment(localDataset.lastUpdated));
            };

            var areDatasetOrgUnitsDifferent = function(remoteDataset, localDataset) {
                return !_.isEmpty(_.xorBy(remoteDataset.organisationUnits, localDataset.organisationUnits, "id"));
            };

            var isLocalDataStale = function(remoteDataset, localDataset) {
                return isDhisDatasetNewer(remoteDataset, localDataset) || areDatasetOrgUnitsDifferent(remoteDataset, localDataset);
            };

            var mergeOrgUnits = function(remoteDataset, localDataset) {
                var mergedOrgUnits = _.unionBy([remoteDataset.organisationUnits, localDataset.organisationUnits], 'id');
                mergedOrgUnits = _.sortBy(mergedOrgUnits, 'id');
                return mergedOrgUnits;
            };

            var merge = function(remoteDataset, localDataset) {
                if (!localDataset) {
                    datasetRepository.upsert(remoteDataset);
                    return;
                }

                if (!isLocalDataStale(remoteDataset, localDataset))
                    return;

                var dataset = _.clone(remoteDataset);
                dataset.organisationUnits = mergeOrgUnits(remoteDataset, localDataset);
                return datasetRepository.upsert(dataset);
            };

            return $q.all(_.map(remoteDatasets, function(remoteDataset) {
                return datasetRepository.get(remoteDataset.id).then(_.curry(merge)(remoteDataset));
            }));
        };
    };
});
