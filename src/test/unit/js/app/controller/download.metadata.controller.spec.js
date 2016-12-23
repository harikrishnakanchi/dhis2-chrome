define(['angularMocks', 'utils', 'platformUtils', 'downloadMetadataController', 'metadataDownloader', 'changeLogRepository', 'packagedDataImporter'],
    function (mocks, utils, platformUtils, DownloadMetadataController, MetadataDownloader, ChangeLogRepository, PackagedDataImporter) {
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
                    downloadMetadataController = new DownloadMetadataController(scope, location, metadataDownloader, changeLogRepository, packagedDataImporter);
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

                it('should send dbReady message to background and redirect to login after data import is complete', function () {
                    expect(platformUtils.sendMessage).toHaveBeenCalledWith('dbReady');
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
                });

                it('should not upsert the metadata changelog if download fails', function () {
                    metadataDownloader.run.and.returnValue(utils.getRejectedPromise(q));

                    initializeController();
                    scope.$apply();

                    expect(changeLogRepository.upsert).not.toHaveBeenCalled();
                });
            });
        });
    });
