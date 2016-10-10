define(['exportRawDataController', 'angularMocks', 'datasetRepository', 'excludedDataElementsRepository', 'orgUnitRepository', 'referralLocationsRepository', 'moduleDataBlockFactory', 'filesystemService', 'translationsService', 'excelBuilder', 'programRepository', 'programEventRepository', 'eventsAggregator', 'utils', 'dateUtils', 'timecop', 'moment', 'lodash'],
    function (ExportRawDataController, mocks, DatasetRepository, ExcludedDataElementsRepository, OrgUnitRepository, ReferralLocationsRepository, ModuleDataBlockFactory, FilesystemService, TranslationsService, excelBuilder, ProgramRepository, ProgramEventRepository, eventsAggregator, utils, dateUtils, timecop, moment, _) {
        describe('ExportRawDataController', function () {
            var controller, rootScope, scope, q, datasetRepository, excludedDataElementsRepository, orgUnitRepository, referralLocationsRepository, moduleDataBlockFactory, filesystemService, translationsService, programRepository, programEventRepository,
                selectedOrgUnit, selectedDataSet, mockEnrichedDataSet, mockExcludedDataElements, mockDataBlocks, mockOriginOrgUnits, mockProgram, mockEvents, mockDataElement;

            beforeEach(mocks.inject(function ($rootScope, $q) {
                rootScope = $rootScope;
                scope = rootScope.$new();
                q = $q;

                scope.resourceBundle = {
                    dataElement: 'Data Element',
                    optionName: 'Option Name',
                    originLabel: 'Origin',
                    lastOneWeek: 'Last week',
                    lastFourWeeks: 'Last 4 weeks',
                    lastEightWeeks: 'Last 8 weeks',
                    lastTwelveWeeks: 'Last 12 weeks'
                };

                mockExcludedDataElements = {
                    dataElements: [
                        { id: 'dataElementId1' },
                        { id: 'dataElementId2' }
                    ]
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

                scope.selectedWeeksToExport = 1;
                scope.orgUnit = selectedOrgUnit;
                scope.selectedDataset = selectedDataSet;

                spyOn(dateUtils, 'getPeriodRange').and.returnValue(['2016W20']);

                spyOn(excelBuilder, 'createWorkBook').and.returnValue(new Blob());
                orgUnitRepository = new OrgUnitRepository();
                spyOn(orgUnitRepository, 'findAllByParent').and.returnValue(utils.getPromise(q, {}));

                filesystemService = new FilesystemService();
                spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

                translationsService = new TranslationsService();
                spyOn(translationsService, 'translate').and.callFake(function(objectToTranslate) { return objectToTranslate; });

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, 'getWithId').and.returnValue(utils.getPromise(q, {}));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, 'get').and.returnValue(utils.getPromise(q, mockExcludedDataElements));
            }));

            describe('AggregateRawData', function () {
                beforeEach(function () {
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

                    datasetRepository = new DatasetRepository();
                    spyOn(datasetRepository, 'includeDataElements').and.returnValue(utils.getPromise(q, [mockEnrichedDataSet]));

                    moduleDataBlockFactory = ModuleDataBlockFactory();
                    spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, mockDataBlocks));

                    controller = new ExportRawDataController(scope, q, datasetRepository, excludedDataElementsRepository, orgUnitRepository, referralLocationsRepository, moduleDataBlockFactory, filesystemService, translationsService, programRepository, programEventRepository);
                });

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

                    describe('exportToExcel', function () {
                        var spreadSheetContent;

                        beforeEach(function () {
                            scope.weeks = ['2016W01', '2016W02'];

                            excelBuilder.createWorkBook.and.callFake(function (workBookContent) {
                                spreadSheetContent = _.first(workBookContent);
                            });

                            scope.exportToExcel();
                        });

                        it('should contain the row headers', function () {
                            var expectedHeader = [scope.resourceBundle.originLabel].concat(scope.weeks);
                            expect(spreadSheetContent.data).toContain(expectedHeader);
                        });

                        it('should contain the origin data', function () {
                            expect(spreadSheetContent.data).toContain(['originNameA', 1, 3]);
                            expect(spreadSheetContent.data).toContain(['originNameB', 2, undefined]);
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

                describe('exportToExcel', function () {
                    beforeEach(function () {
                        Timecop.install();
                    });

                    it('should prompt the user to save Excel file with suggested name', function () {
                        var currentTime = moment('2016-07-21T00:00:00.888Z');
                        Timecop.freeze(currentTime);

                        scope.exportToExcel();

                        var expectedFilename = [selectedOrgUnit.name, selectedDataSet.name, 'export', currentTime.format('DD-MMM-YYYY')].join('.');
                        expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith(expectedFilename, jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.XLSX);
                    });

                    describe('contents of Excel', function () {
                        var spreadSheetContent, sectionA, sectionB;

                        beforeEach(function () {
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

                            excelBuilder.createWorkBook.and.callFake(function (workBookContent) {
                                spreadSheetContent = _.first(workBookContent);
                            });

                            scope.exportToExcel();
                        });

                        it('should contain the row headers', function () {
                            var expectedHeader = [scope.resourceBundle.dataElement].concat(scope.weeks);
                            expect(spreadSheetContent.data).toContain(expectedHeader);
                        });

                        it('should contain the section names', function () {
                            expect(spreadSheetContent.data).toContain([sectionA.name]);
                            expect(spreadSheetContent.data).toContain([sectionB.name]);
                        });

                        it('should contain the data element data', function () {
                            expect(spreadSheetContent.data).toContain(['dataElementNameA', 5, 12]);
                            expect(spreadSheetContent.data).toContain(['dataElementNameB', 6, 16]);
                        });
                    });
                });
            });

            describe('LineListEventsRawData', function () {
                var createMockEvent = function (options) {
                    return _.merge({
                        'period': '2016W13',
                        'event': 'someEventId'
                    }, options);
                };

                beforeEach(function () {
                    selectedOrgUnit = {
                        id: 'orgUnitId',
                        name: 'someModuleName',
                        parent: {
                            id: 'parentOrgUnitId'
                        },
                        lineListService: true
                    };

                    selectedDataSet = {
                        id: 'dataSetId',
                        name: 'someDataSetName'
                    };
                    
                    scope.orgUnit = selectedOrgUnit;
                    scope.selectedDataset = selectedDataSet;

                    mockOriginOrgUnits = [{id: 'originA'}, {id: 'originB'}];

                    mockDataElement = { id: 'someId', isIncluded: true };

                    mockProgram = {
                        id: 'someProgram',
                        programStages: [{
                            programStageSections: [{
                                programStageDataElements: [{
                                    dataElement: mockDataElement
                                }]
                            }]
                        }]
                    };

                    mockExcludedDataElements = [{id: 'someExcludedDataElement'}];

                    mockEvents = [createMockEvent()];

                    orgUnitRepository.findAllByParent.and.returnValue(utils.getPromise(q, mockOriginOrgUnits));

                    excludedDataElementsRepository.get.and.returnValue(utils.getPromise(q, { dataElements: mockExcludedDataElements }));

                    dateUtils.getPeriodRange.and.returnValue(['2016W36', '2016W37', '2016W38']);

                    programRepository = new ProgramRepository();
                    spyOn(programRepository, 'getProgramForOrgUnit').and.returnValue(utils.getPromise(q, mockProgram));
                    spyOn(programRepository, 'get').and.returnValue(utils.getPromise(q, mockProgram));

                    programEventRepository = new ProgramEventRepository();
                    spyOn(programEventRepository, 'findEventsByDateRange').and.returnValue(utils.getPromise(q, mockEvents));
                    
                    spyOn(referralLocationsRepository, 'get').and.returnValue(utils.getPromise(q, {}));

                    spyOn(eventsAggregator, 'buildEventsTree');

                    controller = new ExportRawDataController(scope, q, datasetRepository, excludedDataElementsRepository, orgUnitRepository, referralLocationsRepository, moduleDataBlockFactory, filesystemService, translationsService, programRepository, programEventRepository);
                });

                it('should fetch the origin org units under the selected module', function () {
                    scope.$apply();

                    expect(orgUnitRepository.findAllByParent).toHaveBeenCalledWith(selectedOrgUnit.id);
                    expect(scope.originOrgUnits).toBe(mockOriginOrgUnits);
                });

                it('should fetch the excluded data elements for the selected module', function () {
                    scope.$apply();

                    expect(excludedDataElementsRepository.get).toHaveBeenCalledWith(selectedOrgUnit.id);
                });

                it('should fetch the associated program for the selected module', function () {
                    scope.$apply();

                    expect(programRepository.getProgramForOrgUnit).toHaveBeenCalledWith(mockOriginOrgUnits[0].id);
                    expect(programRepository.get).toHaveBeenCalledWith(mockProgram.id, _.map(mockExcludedDataElements, 'id'));
                });

                it('should fetch all the events in the specified week range for the associated program in selected module', function () {
                    scope.$apply();

                    expect(programEventRepository.findEventsByDateRange).toHaveBeenCalledWith(mockProgram.id, _.map(scope.originOrgUnits, 'id'), '2016-09-05', '2016-09-25');
                });

                it('should recursively group all the events by origin, by period', function () {
                    scope.selectedDataset = {
                        id: 'someId',
                        isOriginDataset: true
                    };

                    var eventA = createMockEvent({orgUnitName: 'originA', period: '2016W13'}),
                        eventB = createMockEvent({orgUnitName: 'originA', period: '2016W14'}),
                        eventC = createMockEvent({orgUnitName: 'originB', period: '2016W14'});

                    programEventRepository.findEventsByDateRange.and.returnValue(utils.getPromise(q, [eventA, eventB, eventC]));
                    scope.$apply();

                    var expectedValue = {
                        originA: {
                            '2016W13': [eventA],
                            '2016W14': [eventB]
                        },
                        originB: {
                            '2016W14': [eventC]
                        }
                    };

                    expect(scope.originSummary).toEqual(expectedValue);
                });

                it('should call the events aggregator to build events tree', function () {
                    scope.$apply();
                    expect(eventsAggregator.buildEventsTree).toHaveBeenCalledWith(mockEvents, ['period'], [mockDataElement.id]);
                });

                it('should get referral locations for the given opUnit', function () {
                    scope.selectedDataset = {
                        isReferralDataset: true
                    };
                    scope.$apply();
                    expect(referralLocationsRepository.get).toHaveBeenCalledWith(scope.orgUnit.parent.id);
                });

                it('should translate program', function () {
                    scope.$apply();
                    expect(translationsService.translate).toHaveBeenCalledWith(mockProgram);
                });

                describe('contents of Excel', function () {
                    var spreadSheetContent, dataElementA, dataElementB, optionA, optionB;

                    beforeEach(function () {
                        scope.weeks = ['2016W01', '2016W02'];

                        optionA = {
                            id: 'optionIdA',
                            name: 'optionNameA'
                        };
                        optionB = {
                            id: 'optionIdB',
                            name: 'optionNameB'
                        };
                        dataElementA = {
                            id: 'dataElementIdA',
                            name: 'dataElementNameA',
                            optionSet: {
                                options: [optionA, optionB]
                            }
                        };
                        dataElementB = {
                            id: 'dataElementIdB',
                            name: 'dataElementNameB'
                        };
                        scope.summaryDataElements = [dataElementA, dataElementB];
                        scope.eventSummary = {
                            dataElementIdA: {
                                optionIdA: {
                                    '2016W01': ['eventA']
                                }
                            }
                        };

                        excelBuilder.createWorkBook.and.callFake(function (workBookContent) {
                            spreadSheetContent = _.first(workBookContent);
                        });

                        scope.exportToExcel();
                    });

                    it('should contain the row headers', function () {
                        var expectedHeader = [scope.resourceBundle.optionName].concat(scope.weeks);
                        expect(spreadSheetContent.data).toContain(expectedHeader);
                    });

                    it('should contain the data element names', function () {
                        expect(spreadSheetContent.data).toContain([dataElementA.name]);
                    });

                    it('should contain the data for each option', function () {
                        expect(spreadSheetContent.data).toContain([optionA.name, 1, undefined]);
                    });

                    it('should ignore data elements for which no data values exist', function () {
                        expect(spreadSheetContent.data).not.toContain([dataElementB.name]);
                    });

                    it('should ignore options for which no data values exist', function () {
                        expect(spreadSheetContent.data).not.toContain([optionB.name, undefined, undefined]);
                    });
                });
            });
        });
    });
