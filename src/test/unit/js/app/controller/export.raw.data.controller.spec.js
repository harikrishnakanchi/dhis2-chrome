define(['exportRawDataController', 'angularMocks', 'datasetRepository', 'excludedDataElementsRepository', 'moduleDataBlockFactory', 'filesystemService', 'translationsService', 'utils', 'dateUtils', 'timecop', 'moment', 'lodash'],
    function (ExportRawDataController, mocks, DatasetRepository, ExcludedDataElementsRepository, ModuleDataBlockFactory, FilesystemService, TranslationsService, utils, dateUtils, timecop, moment, _) {
        describe('ExportRawDataController', function () {
            var controller, rootScope, scope, q, datasetRepository, excludedDataElementsRepository, moduleDataBlockFactory, filesystemService, translationsService,
                mockOrgUnit, mockDataset, mockEnrichedDataset, mockExcludedDataElements, mockDataBlocks;

            beforeEach(mocks.inject(function ($rootScope, $q) {
                rootScope = $rootScope;
                scope = rootScope.$new();
                q = $q;

                scope.resourceBundle = {
                    dataElement: 'Data Element',
                    lastOneWeek: 'Last week',
                    lastFourWeeks: 'Last 4 weeks',
                    lastEightWeeks: 'Last 8 weeks',
                    lastTwelveWeeks: 'Last 12 weeks'
                };

                mockOrgUnit = {
                    id: 'orgUnitId',
                    name: 'someModuleName'
                };
                mockDataset = {
                    id: 'selected dataset id',
                    name: 'someDataSetName'
                };

                mockEnrichedDataset = {
                    name: 'data set name',
                    sections: [{
                        id: 'section 1 id',
                        isIncluded: true,
                        dataElements: [{
                            id: 'dataElementId'
                        }]
                    }, {
                        id: 'section 2 id',
                        isIncluded: true,
                        dataElements: []
                    }]
                };

                mockDataBlocks = [{
                    period: '2016W01',
                    dataValues: [{
                        period: '2016W01',
                        dataElement: 'deId1',
                        value: '3'
                    }, {
                        period: '2016W01',
                        dataElement: 'deId1',
                        value: '2'
                    }, {
                        period: '2016W01',
                        dataElement: 'deId2',
                        value: '6'
                    }]
                }, {
                    period: '2016W25',
                    dataValues: [{
                        period: '2016W25',
                        dataElement: 'deId3',
                        value: '5'
                    }, {
                        period: '2016W25',
                        dataElement: 'deId4',
                        value: '16'
                    }, {
                        period: '2016W25',
                        dataElement: 'deId3',
                        value: '7'
                    }]
                }];

                mockExcludedDataElements = {dataElements: [{id: 'deId1'}, {id: 'deId2'}]};

                scope.selectedWeeksToExport = 1;
                scope.orgUnit = mockOrgUnit;
                scope.selectedDataset = mockDataset;

                spyOn(dateUtils, 'getPeriodRange').and.returnValue(['2016W20']);

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'includeDataElements').and.returnValue(utils.getPromise(q, [mockEnrichedDataset]));

                moduleDataBlockFactory = ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, mockDataBlocks));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, 'get').and.returnValue(utils.getPromise(q, mockExcludedDataElements));

                filesystemService = new FilesystemService();
                spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

                translationsService = new TranslationsService();
                spyOn(translationsService, 'translate').and.callFake(function(objectToTranslate) { return objectToTranslate; });

                controller = new ExportRawDataController(scope, q, datasetRepository, excludedDataElementsRepository, moduleDataBlockFactory, filesystemService, translationsService);
            }));

            it('should fetch sections along with dataelements', function () {
                scope.$apply();
                expect(datasetRepository.includeDataElements).toHaveBeenCalledWith([mockDataset], _.map(mockExcludedDataElements.dataElements, 'id'));
            });

            it('should filter out excluded dataSetSections', function () {
                mockEnrichedDataset = {
                    name: 'data set name',
                    sections: [{
                        id: 'section 1 id',
                        isIncluded: true,
                        dataElements: [{
                            id: 'dataElementId'
                        }]
                    }, {
                        id: 'section 2 id',
                        isIncluded: false,
                        dataElements: []
                    }]
                };

                datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockEnrichedDataset]));
                scope.$apply();
                expect(scope.sections).toEqual(_.filter(mockEnrichedDataset.sections, 'isIncluded'));
            });

            it('should filter out excluded DataElements', function () {
                var dataElements = [{
                    id: 'dataElementId 1',
                    isIncluded: true
                }, {
                    id: 'dataElementId 2',
                    isIncluded: false
                }];
                var dataSetSection = {
                    id: 'section 1 id',
                    isIncluded: true,
                    dataElements: dataElements
                };

                mockEnrichedDataset = {
                    name: 'data set name',
                    sections: [dataSetSection]
                };

                datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockEnrichedDataset]));
                scope.$apply();
                expect(dataSetSection.dataElements).toEqual(_.filter(dataElements, 'isIncluded'));
            });

            it('should translate the filtered DataSetSections', function () {
                mockEnrichedDataset = {
                    name: 'someDataSetName',
                    sections: [{
                        id: 'someDataSetSection',
                        isIncluded: true
                    }]
                };
                datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockEnrichedDataset]));
                scope.$apply();

                expect(translationsService.translate).toHaveBeenCalledWith(mockEnrichedDataset);
            });

            it('should populate the specified week range', function () {
                var periodRange = ['2016W20', '2016W21'];
                dateUtils.getPeriodRange.and.returnValue(periodRange);
                scope.$apply();

                expect(dateUtils.getPeriodRange).toHaveBeenCalledWith(scope.selectedWeeksToExport, { excludeCurrentWeek: true });
                expect(scope.weeks).toEqual(periodRange);
            });

            it('should create module data block for the given module and period range', function () {
                scope.$apply();
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(mockOrgUnit.id, scope.weeks);
            });

            it('should create two-dimensional map of data values by week by data element', function () {
                scope.$apply();

                var expectedDataValues = {
                    '2016W01': {
                        deId1: 5,
                        deId2: 6
                    },
                    '2016W25': {
                        deId3: 12,
                        deId4: 16
                    }
                };

                expect(scope.dataValuesMap).toEqual(expectedDataValues);
            });

            describe('exportToCSV', function () {
                beforeEach(function () {
                    Timecop.install();
                });

                afterEach(function() {
                    Timecop.returnToPresent();
                    Timecop.uninstall();
                });

                it('should prompt the user to save CSV file with suggested name', function () {
                    var currentTime = moment('2016-07-21T00:00:00.888Z');
                    Timecop.freeze(currentTime);

                    scope.exportToCSV();

                    var expectedFilename = [mockOrgUnit.name, mockDataset.name, 'export', currentTime.format('YYYYMMDD'), 'csv'].join('.');
                    expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFilename, jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.CSV);
                });

                describe('contents of csv', function () {
                    var csvContent, sectionA, sectionB;

                    beforeEach(function () {
                        csvContent = null;
                        scope.weeks = ['2016W01', '2016W02'];
                        scope.dataValuesMap = {
                            '2016W01': {
                                dataElementIdA: 5,
                                dataElementIdB: 6
                            },
                            '2016W02': {
                                dataElementIdA: 12,
                                dataElementIdB: 16
                            }
                        };
                        sectionA = {
                            name: 'sectionNameA',
                            dataElements: [{
                                id: 'dataElementIdA',
                                formName: 'dataElementNameA'
                            }]
                        };
                        sectionB = {
                            name: 'sectionNameB',
                            dataElements: [{
                                id: 'dataElementIdB',
                                formName: 'dataElementNameB'
                            }]
                        };
                        scope.sections = [sectionA, sectionB];

                        spyOn(window, 'Blob').and.callFake(function (contentArray) {
                            this.value = contentArray.join();
                        });

                        filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                            csvContent = blob.value;
                        });

                        scope.exportToCSV();
                    });

                    it('should contain the row headers', function () {
                        var expectedHeader = [scope.resourceBundle.dataElement].concat(scope.weeks).join(',');
                        expect(csvContent).toContain(expectedHeader);
                    });

                    it('should contain the section names', function () {
                        expect(csvContent).toContain(sectionA.name);
                        expect(csvContent).toContain(sectionB.name);
                    });

                    it('should contain the data element data', function () {
                        expect(csvContent).toContain('"dataElementNameA",5,12');
                        expect(csvContent).toContain('"dataElementNameB",6,16');
                    });
                });
            });
        });
    });
