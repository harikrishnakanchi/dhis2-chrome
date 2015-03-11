define(["downloadDatasetConsumer", "datasetService", "utils", "angularMocks", "datasetRepository", "mergeBy"],
    function(DownloadDatasetConsumer, DatasetService, utils, mocks, DatasetRepository, MergeBy) {
        describe("download dataset consumer", function() {
            var scope, q, datasetService, datasetRepository, downloadDatasetConsumer, changeLogRepository, mergeBy;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                q = $q;
                scope = $rootScope.$new();

                changeLogRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, "2014-10-24T09:01:12.020+0000")),
                    "upsert": jasmine.createSpy("upsert")
                };

                datasetService = new DatasetService();
                datasetRepository = new DatasetRepository();
                mergeBy = new MergeBy($log);
            }));

            it("should save new dataset from dhis into the local repo", function() {
                var dhisDatasets = [{
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T10:00:00.000+0000',
                    'organisationUnits': []
                }];

                spyOn(datasetRepository, 'upsert');
                spyOn(datasetRepository, 'upsertDhisDownloadedData');
                spyOn(datasetRepository, 'findAll').and.returnValue(utils.getPromise(q, []));
                spyOn(datasetService, 'getAll').and.returnValue(utils.getPromise(q, dhisDatasets));

                var message = {
                    'data': {
                        'data': [],
                        'type': 'downloadDataset'
                    },
                    'created': '2015-01-02T09:00:00.000+0000'
                };

                downloadDatasetConsumer = new DownloadDatasetConsumer(datasetService, datasetRepository, q, changeLogRepository, mergeBy);
                downloadDatasetConsumer.run(message);
                scope.$apply();

                expect(datasetRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(dhisDatasets);
            });

            it("should overwrite local dataset with dhis copy when dataset is newer in dhis", function() {
                var localDataset = [{
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T09:00:00.000+0000',
                    'organisationUnits': []
                }];

                var dhisDatasets = [{
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T10:00:00.000+0000',
                    'organisationUnits': []
                }];

                spyOn(datasetRepository, 'upsertDhisDownloadedData');
                spyOn(datasetRepository, 'findAll').and.returnValue(utils.getPromise(q, localDataset));
                spyOn(datasetService, 'getAll').and.returnValue(utils.getPromise(q, dhisDatasets));

                var message = {
                    'data': {
                        'data': [],
                        'type': 'downloadDataset'
                    },
                    'created': '2015-01-02T09:00:00.000+0000'
                };

                downloadDatasetConsumer = new DownloadDatasetConsumer(datasetService, datasetRepository, q, changeLogRepository, mergeBy);
                downloadDatasetConsumer.run(message);
                scope.$apply();

                expect(datasetRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(dhisDatasets);
            });

            it("should merge local dataset with dhis copy when new orgunits are associated to the dataset either in dhis or locally", function() {
                var originalDataset = {
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T09:00:00.000+0000',
                    'organisationUnits': [{
                        'id': 'ou1'
                    }]
                };

                var locallyUpdatedDataset = {
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T09:00:00.000+0000',
                    'clientLastUpdated': '2015-01-01T10:00:00.000Z',
                    'organisationUnits': [{
                        'id': 'ou1'
                    }, {
                        'id': 'ou3'
                    }]
                };

                var dhisUpdatedDataset = {
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T11:00:00.000Z',
                    'organisationUnits': [{
                        'id': 'ou1'
                    }, {
                        'id': 'ou2'
                    }]
                };

                spyOn(datasetRepository, 'upsert');
                spyOn(datasetRepository, 'upsertDhisDownloadedData');
                spyOn(datasetRepository, 'findAll').and.returnValue(utils.getPromise(q, [locallyUpdatedDataset]));
                spyOn(datasetService, 'getAll').and.returnValue(utils.getPromise(q, [dhisUpdatedDataset]));

                var message = {
                    'data': {
                        'data': [],
                        'type': 'downloadDataset'
                    },
                    'created': '2015-01-02T09:00:00.000+0000'
                };

                downloadDatasetConsumer = new DownloadDatasetConsumer(datasetService, datasetRepository, q, changeLogRepository, mergeBy);
                downloadDatasetConsumer.run(message);
                scope.$apply();

                var expectedUpsertedDataset = [{
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T11:00:00.000Z',
                    'organisationUnits': [{
                        'id': 'ou1'
                    }, {
                        'id': 'ou2'
                    }, {
                        'id': 'ou3'
                    }]
                }];
                expect(datasetRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(expectedUpsertedDataset);
            });
        });
    });
