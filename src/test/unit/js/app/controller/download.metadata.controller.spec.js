define(['angularMocks', 'utils','properties', 'platformUtils', 'downloadMetadataController', 'metadataDownloader', 'changeLogRepository', 'packagedDataImporter'],
    function (mocks, utils, properties, platformUtils, DownloadMetadataController, MetadataDownloader, ChangeLogRepository, PackagedDataImporter) {
        describe('DownloadMetadataController', function () {
            var q, rootScope, scope, location, downloadMetadataController, metadataDownloader, changeLogRepository, packagedDataImporter, initializeController;

            beforeEach(mocks.inject(function ($q, $rootScope, $location) {
                q = $q;
                rootScope = $rootScope;
                location = $location;
                scope = $rootScope.$new();

                spyOn(location, 'path');
                spyOn(platformUtils, 'sendMessage');

                metadataDownloader = new MetadataDownloader();
                spyOn(metadataDownloader, 'run').and.returnValue(utils.getPromise(q, {}));

                changeLogRepository = new ChangeLogRepository();
                spyOn(changeLogRepository, 'upsert').and.returnValue(utils.getPromise(q, {}));

                packagedDataImporter = new PackagedDataImporter();
                spyOn(packagedDataImporter, 'run').and.returnValue(utils.getPromise(q, {}));

                Timecop.install();
                Timecop.freeze(new Date('2016-12-23T11:05:29.002Z'));

                initializeController = function () {
                    downloadMetadataController = new DownloadMetadataController(scope, q, location, metadataDownloader, changeLogRepository, packagedDataImporter);
                };
            }));

            afterEach(function () {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            describe('Chrome platform', function () {
                beforeEach(function () {
                    platformUtils.platform = 'chrome';

                    initializeController();
                    scope.$apply();
                });

                it('should import the metadata using packagedDataImporter', function () {
                    expect(packagedDataImporter.run).toHaveBeenCalled();
                });

                it('should redirect to login after data import is complete', function () {
                    expect(location.path).toHaveBeenCalledWith('/login');
                });
            });

            describe('Web platform', function () {
                beforeEach(function () {
                    platformUtils.platform = 'web';
                });

                it('should download the metadata', function () {
                    initializeController();
                    scope.$apply();

                    expect(metadataDownloader.run).toHaveBeenCalled();
                });

                it('should upsert the metadata changelog after download is complete', function () {
                    initializeController();
                    scope.$apply();

                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('metaData', '2016-12-23T11:05:29.002Z');
                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('orgUnits', '2016-12-23T11:05:29.002Z');
                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('orgUnitGroups', '2016-12-23T11:05:29.002Z');
                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('datasets', '2016-12-23T11:05:29.002Z');
                    expect(changeLogRepository.upsert).toHaveBeenCalledWith('programs', '2016-12-23T11:05:29.002Z');
                });

                describe('Metadata download failure', function () {

                    it('should retry metadata download', function () {
                        var count = 0;
                        metadataDownloader.run.and.callFake(function () {
                            count++;
                            return count == 1 ? utils.getRejectedPromise(q) : utils.getPromise(q);
                        });

                        initializeController();
                        scope.$apply();

                        expect(metadataDownloader.run).toHaveBeenCalledTimes(2);
                    });

                    it('should not retry metadata download more than the given retries', function () {
                        var count = 0;
                        metadataDownloader.run.and.callFake(function () {
                            count++;
                            return count < 8 ? utils.getRejectedPromise(q) : utils.getPromise(q);
                        });

                        initializeController();
                        scope.$apply();

                        expect(metadataDownloader.run).toHaveBeenCalledTimes(properties.metaDataRetryLimit);
                        expect(changeLogRepository.upsert).not.toHaveBeenCalled();
                    });
                });
            });
        });
    });
