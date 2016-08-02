define(['exportRawDataController', 'angularMocks', 'datasetRepository', 'excludedDataElementsRepository', 'orgUnitRepository', 'referralLocationsRepository', 'moduleDataBlockFactory', 'filesystemService', 'translationsService', 'utils', 'dateUtils', 'timecop', 'moment', 'lodash'],
    function (ExportRawDataController, mocks, DatasetRepository, ExcludedDataElementsRepository, OrgUnitRepository, ReferralLocationsRepository, ModuleDataBlockFactory, FilesystemService, TranslationsService, utils, dateUtils, timecop, moment, _) {
        describe('ExportRawDataController', function () {
            var controller, rootScope, scope, q, datasetRepository, excludedDataElementsRepository, orgUnitRepository, referralLocationsRepository, moduleDataBlockFactory, filesystemService, translationsService,
                selectedOrgUnit, selectedDataSet, mockEnrichedDataSet, mockExcludedDataElements, mockDataBlocks;

            beforeEach(mocks.inject(function ($rootScope, $q) {
                rootScope = $rootScope;
                scope = rootScope.$new();
                q = $q;

                scope.resourceBundle = {
                    dataElement: 'Data Element',
                    originLabel: 'Origin',
                    lastOneWeek: 'Last week',
                    lastFourWeeks: 'Last 4 weeks',
                    lastEightWeeks: 'Last 8 weeks',
                    lastTwelveWeeks: 'Last 12 weeks'
                };

                selectedOrgUnit = {
                    id: 'orgUnitId',
                    name: 'someModuleName',
                    parent: {
                        id: 'parentOrgUnitId'
                    }
                };
                selectedDataSet = {
                    id: 'dataSetId',
                    name: 'someDataSetName'
                };

                mockEnrichedDataSet = {
                    name: 'someDataSetName',
                    sections: [{
                        id: 'sectionIdA',
                        isIncluded: true,
                        dataElements: [{
                            id: 'dataElementId1',
                            isIncluded: true
                        }, {
                            id: 'dataElementId2',
                            isIncluded: true
                        }, {
                            id: 'dataElementId3',
                            isIncluded: true
                        }, {
                            id: 'dataElementId4',
                            isIncluded: true
                        }]
                    }, {
                        id: 'sectionIdB',
                        isIncluded: true,
                        dataElements: []
                    }]
                };

                mockDataBlocks = [{
                    period: '2016W01',
                    dataValues: [{
                        period: '2016W01',
                        dataElement: 'dataElementId1',
                        value: '3'
                    }, {
                        period: '2016W01',
                        dataElement: 'dataElementId1',
                        value: '2'
                    }, {
                        period: '2016W01',
                        dataElement: 'dataElementId2',
                        value: '6'
                    }]
                }, {
                    period: '2016W02',
                    dataValues: [{
                        period: '2016W02',
                        dataElement: 'dataElementId3',
                        value: '5'
                    }, {
                        period: '2016W02',
                        dataElement: 'dataElementId4',
                        value: '16'
                    }, {
                        period: '2016W02',
                        dataElement: 'dataElementId3',
                        value: '7'
                    }]
                }];

                mockExcludedDataElements = {
                    dataElements: [
                        { id: 'dataElementId1' },
                        { id: 'dataElementId2' }
                    ]
                };

                scope.selectedWeeksToExport = 1;
                scope.orgUnit = selectedOrgUnit;
                scope.selectedDataset = selectedDataSet;

                spyOn(dateUtils, 'getPeriodRange').and.returnValue(['2016W20']);

                datasetRepository = new DatasetRepository();
                spyOn(datasetRepository, 'includeDataElements').and.returnValue(utils.getPromise(q, [mockEnrichedDataSet]));

                moduleDataBlockFactory = ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, mockDataBlocks));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, 'get').and.returnValue(utils.getPromise(q, mockExcludedDataElements));

                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, {}));

                filesystemService = new FilesystemService();
                spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

                translationsService = new TranslationsService();
                spyOn(translationsService, 'translate').and.callFake(function(objectToTranslate) { return objectToTranslate; });

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, 'getWithId').and.returnValue(utils.getPromise(q, {}));

                controller = new ExportRawDataController(scope, q, datasetRepository, excludedDataElementsRepository, orgUnitRepository, referralLocationsRepository, moduleDataBlockFactory, filesystemService, translationsService);
            }));

            it('should fetch sections along with data elements', function () {
                scope.$apply();
                expect(datasetRepository.includeDataElements).toHaveBeenCalledWith([selectedDataSet], _.map(mockExcludedDataElements.dataElements, 'id'));
            });

            it('should filter out excluded dataSetSections', function () {
                mockEnrichedDataSet = {
                    sections: [{
                        id: 'sectionIdA',
                        isIncluded: true,
                        dataElements: []
                    }, {
                        id: 'sectionIdB',
                        isIncluded: false,
                        dataElements: []
                    }]
                };

                datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockEnrichedDataSet]));
                scope.$apply();
                expect(scope.sections).toEqual(_.filter(mockEnrichedDataSet.sections, 'isIncluded'));
            });

            it('should filter out excluded DataElements', function () {
                var dataElements = [{
                    id: 'dataElementIdA',
                    isIncluded: true
                }, {
                    id: 'dataElementIdB',
                    isIncluded: false
                }];
                var dataSetSection = {
                    id: 'sectionIdA',
                    isIncluded: true,
                    dataElements: dataElements
                };

                mockEnrichedDataSet = {
                    name: 'someDataSetName',
                    sections: [dataSetSection]
                };

                datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockEnrichedDataSet]));
                scope.$apply();
                expect(dataSetSection.dataElements).toEqual(_.filter(dataElements, 'isIncluded'));
            });

            it('should filter out all the draft dataValues', function () {
                mockDataBlocks = [{
                    period: '2016W01',
                    dataValues: [{
                        period: '2016W01',
                        dataElement: 'dataElementId1',
                        value: '3',
                        isDraft: true
                    }]
                }];
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, mockDataBlocks));
                scope.$apply();

                expect(scope.dataValuesMap).toEqual({});
            });

            it('should translate the filtered DataSetSections', function () {
                scope.$apply();

                expect(translationsService.translate).toHaveBeenCalledWith(mockEnrichedDataSet);
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
                expect(moduleDataBlockFactory.createForModule).toHaveBeenCalledWith(selectedOrgUnit.id, scope.weeks);
            });

            it('should create two-dimensional map of data values by week by data element', function () {
                scope.$apply();

                var expectedDataValues = {
                    '2016W01': {
                        dataElementId1: 5,
                        dataElementId2: 6
                    },
                    '2016W02': {
                        dataElementId3: 12,
                        dataElementId4: 16
                    }
                };

                expect(scope.dataValuesMap).toEqual(expectedDataValues);
            });

            it('should create map of data values only for data elements in selected dataSet', function () {
                mockDataBlocks = [{
                    period: '2016W01',
                    dataValues: [{
                        period: '2016W01',
                        dataElement: 'dataElementIdForDataSetA',
                        value: '1'
                    }, {
                        period: '2016W01',
                        dataElement: 'dataElementIdForDataSetB',
                        value: '2'
                    }]
                }];
                mockEnrichedDataSet = {
                    name: 'dataSetNameA',
                    sections: [{
                        id: 'sectionId',
                        isIncluded: true,
                        dataElements: [{
                            id: 'dataElementIdForDataSetA',
                            isIncluded: true
                        }]
                    }]
                };

                datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockEnrichedDataSet]));
                moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, mockDataBlocks));

                scope.$apply();
                expect(scope.dataValuesMap['2016W01']).toEqual({ dataElementIdForDataSetA: 1 });
            });

            describe('selected dataSet is an origin dataSet', function () {
                var mockDataSet, dataSetSection, dataElements, mockOriginOrgUnits;

                beforeEach(function () {
                    dataElements = [{
                        id: 'dataElementId1',
                        isIncluded: true,
                        associatedProgramId: 'someProgramId'
                    }, {
                        id: 'dataElementId2',
                        isIncluded: true
                    }];

                    dataSetSection = {
                        id: 'sectionIdA',
                        isIncluded: true,
                        dataElements: dataElements
                    };

                    mockDataSet = {
                        name: 'someDataSetName',
                        isOriginDataset: true,
                        sections: [dataSetSection],
                    };

                    mockDataBlocks = [{
                        period: '2016W01',
                        dataValues: [{
                            orgUnit: 'orgUnitA',
                            period: '2016W01',
                            dataElement: 'dataElementId2',
                            value: '1'
                        }, {
                            orgUnit: 'orgUnitB',
                            period: '2016W01',
                            dataElement: 'dataElementId2',
                            value: '2'
                        }]
                    }, {
                        period: '2016W02',
                        dataValues: [{
                            orgUnit: 'orgUnitA',
                            period: '2016W02',
                            dataElement: 'dataElementId2',
                            value: '3'
                        }]
                    }];

                    mockOriginOrgUnits = [{
                        id: 'orgUnitA',
                        name: 'originNameA'
                    }, {
                        id: 'orgUnitB',
                        name: 'originNameB'
                    }];

                    scope.selectedDataset = mockDataSet;
                    datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockDataSet]));
                    moduleDataBlockFactory.createForModule.and.returnValue(utils.getPromise(q, mockDataBlocks));
                    orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, mockOriginOrgUnits));
                    scope.$apply();
                });

                it('should fetch origins of selected orgUnit', function () {
                    expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith(selectedOrgUnit.id);
                });

                it('should filter out data elements with an associatedProgramId', function () {
                    expect(dataSetSection.dataElements).toEqual(_.reject(dataElements, 'associatedProgramId'));
                });

                it('should create two-dimension map of data values by week by orgUnit', function () {
                    var expectedDataValues = {
                        '2016W01': {
                            orgUnitA: 1,
                            orgUnitB: 2
                        },
                        '2016W02': {
                            orgUnitA: 3
                        }
                    };

                    expect(scope.dataValuesMap).toEqual(expectedDataValues);
                });

                describe('exportToCSV', function () {
                    var csvContent;

                    beforeEach(function () {
                        scope.weeks = ['2016W01', '2016W02'];

                        spyOn(window, 'Blob').and.callFake(function (contentArray) {
                            this.value = contentArray.join();
                        });

                        filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                            csvContent = blob.value;
                        });

                        scope.exportToCSV();
                    });

                    it('should contain the row headers', function () {
                        var expectedHeader = [scope.resourceBundle.originLabel].concat(scope.weeks).join(',');
                        expect(csvContent).toContain(expectedHeader);
                    });

                    it('should contain the origin data', function () {
                        expect(csvContent).toContain('"originNameA",1,3');
                        expect(csvContent).toContain('"originNameB",2,');
                    });
                });
            });

            describe('selected dataset is a referral location', function () {
                var mockReferralLocations, mockDataSet, dataElements, dataSetSection;

                beforeEach(function () {
                    dataElements = [{
                        id: 'dataElementId1',
                        formName: 'referralLocation1',
                        isIncluded: true
                    }, {
                        id: 'dataElementId2',
                        formName: 'referralLocation2',
                        isIncluded: true
                    }];

                    dataSetSection = {
                        id: 'sectionIdA',
                        isIncluded: true,
                        dataElements: dataElements
                    };

                    mockDataSet = {
                        name: 'someDataSetName',
                        isReferralDataset: true,
                        sections: [dataSetSection]
                    };
                    mockReferralLocations = {
                        orgUnit: 'someOpUnitId',
                        referralLocations: [{
                            id: 'dataElementId1',
                            name: 'some referral location',
                            isDisabled: false
                        }, {
                            id: 'dataElementId2',
                            name: 'some referral location 2',
                            isDisabled: true
                        }]
                    };

                    scope.selectedDataset = mockDataSet;
                    datasetRepository.includeDataElements.and.returnValue(utils.getPromise(q, [mockDataSet]));
                    referralLocationsRepository.getWithId.and.returnValue(utils.getPromise(q, mockReferralLocations));
                });

                it('should fetch referral locations of the selected orgUnit', function () {
                    scope.$apply();
                    expect(referralLocationsRepository.getWithId).toHaveBeenCalledWith(selectedOrgUnit.parent.id);
                });

                it('should filter out data elements without an enabled alias', function () {
                    scope.$apply();

                    var dataElementIds = _.map(_.first(scope.sections).dataElements, 'id');
                    expect(dataElementIds).toEqual(['dataElementId1']);
                });

                it('should replace the formName with the configured referral location name', function () {
                    scope.$apply();

                    var dataElementFormNames = _.map(_.first(scope.sections).dataElements, 'formName');
                    expect(dataElementFormNames).toEqual([mockReferralLocations.referralLocations[0].name]);
                });

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

                    var expectedFilename = [selectedOrgUnit.name, selectedDataSet.name, 'export', currentTime.format('DD-MMM-YYYY')].join('.');
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
