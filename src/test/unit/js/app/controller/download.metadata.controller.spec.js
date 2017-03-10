define(['lodash', 'angularMocks', 'utils','properties', 'platformUtils', 'downloadMetadataController', 'metadataDownloader', 'packagedDataImporter'],
    function (_, mocks, utils, properties, platformUtils, DownloadMetadataController, MetadataDownloader, PackagedDataImporter) {
        describe('DownloadMetadataController', function () {
            var q, rootScope, scope, location, log, downloadMetadataController, metadataDownloader, packagedDataImporter, initializeController;

            beforeEach(mocks.inject(function ($q, $rootScope, $location, $log) {
                q = $q;
                location = $location;
                log = $log;
                rootScope = $rootScope;
                scope = $rootScope.$new();

                spyOn(location, 'path');
                spyOn(platformUtils, 'sendMessage');

                metadataDownloader = new MetadataDownloader();
                spyOn(metadataDownloader, 'run').and.returnValue(utils.getPromise(q, {}));

                packagedDataImporter = new PackagedDataImporter();
                spyOn(packagedDataImporter, 'run').and.returnValue(utils.getPromise(q, {}));

                initializeController = function () {
                    downloadMetadataController = new DownloadMetadataController(scope, q, location, log, metadataDownloader, packagedDataImporter);
                };
            }));

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
                    });

                    it('should show message for invalid product key', function () {
                        metadataDownloader.run.and.returnValue(utils.getRejectedPromise(q, 'productKeyExpired'));

                        initializeController();
                        scope.$apply();

                        expect(scope.productKeyExpired).toBeTruthy();
                    });
                });
            });
        });
    });
