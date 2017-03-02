define(["downloadDataSetConsumer", "dataSetService", "systemInfoService", "utils", "angularMocks", "dataSetRepository", "mergeBy"],
    function(DownloadDatasetConsumer, DatasetService, SystemInfoService, utils, mocks, DatasetRepository, MergeBy) {
        describe("download dataset consumer", function() {
            var scope, q, datasetService, systemInfoService, datasetRepository, downloadDatasetConsumer, changeLogRepository, mergeBy,
                message;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                q = $q;
                scope = $rootScope.$new();

                changeLogRepository = {
                    "get": jasmine.createSpy("get").and.returnValue(utils.getPromise(q, "2014-10-24T09:01:12.020+0000")),
                    "upsert": jasmine.createSpy("upsert")
                };

                datasetService = new DatasetService();
                datasetRepository = new DatasetRepository();
                systemInfoService = new SystemInfoService();
                mergeBy = new MergeBy($log);
                message = {};

                spyOn(datasetRepository, 'upsertDhisDownloadedData');
                spyOn(datasetService, 'getAll').and.returnValue(utils.getPromise(q, []));
                spyOn(datasetRepository, 'findAllDhisDatasets').and.returnValue(utils.getPromise(q, []));
                spyOn(systemInfoService, 'getServerDate').and.returnValue(utils.getPromise(q, ''));
            }));

            var createDownloadDataSetConsumer = function () {
                return new DownloadDatasetConsumer(datasetService, systemInfoService, datasetRepository, q, changeLogRepository, mergeBy);
            };

            it("should save new dataset from dhis into the local repo", function() {
                var dhisDatasets = [{
                    'id': 'ds1',
                    'lastUpdated': '2015-01-01T10:00:00.000+0000',
                    'organisationUnits': []
                }];

                datasetService.getAll.and.returnValue(utils.getPromise(q, dhisDatasets));

                downloadDatasetConsumer = createDownloadDataSetConsumer();
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

                datasetRepository.findAllDhisDatasets.and.returnValue(utils.getPromise(q, localDataset));
                datasetService.getAll.and.returnValue(utils.getPromise(q, dhisDatasets));

                downloadDatasetConsumer = createDownloadDataSetConsumer();
                downloadDatasetConsumer.run(message);
                scope.$apply();

                expect(datasetRepository.upsertDhisDownloadedData).toHaveBeenCalledWith(dhisDatasets);
            });

            it("should merge local dataset with dhis copy when new orgunits are associated to the dataset either in dhis or locally", function() {
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

                datasetRepository.findAllDhisDatasets.and.returnValue(utils.getPromise(q, [locallyUpdatedDataset]));
                datasetService.getAll.and.returnValue(utils.getPromise(q, [dhisUpdatedDataset]));

                downloadDatasetConsumer = createDownloadDataSetConsumer();
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

            it('should upsert the change log repository with the system info time', function () {
                systemInfoService.getServerDate.and.returnValue(utils.getPromise(q, 'someTime'));

                downloadDatasetConsumer = createDownloadDataSetConsumer();
                downloadDatasetConsumer.run(message);
                scope.$apply();

                expect(changeLogRepository.upsert).toHaveBeenCalledWith('dataSets', 'someTime');
            });

        });
    });
