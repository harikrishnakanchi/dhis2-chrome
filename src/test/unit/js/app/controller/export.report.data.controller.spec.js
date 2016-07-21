define(['exportReportDataController', 'angularMocks', 'utils', 'lodash', 'timecop', 'datasetRepository', 'excludedDataElementsRepository', 'moduleDataBlockFactory', 'dateUtils'],
    function (ExportReportDataController, mocks, utils, _, timecop, DatasetRepository, ExcludedDataElementsRepository, ModuleDataBlockFactory, dateUtils) {
        describe('ExportReportDataController', function () {
            var controller, rootScope, scope, q, datasetRepository, excludedDataElementsRepository, moduleDataBlockFactory,
                mockOrgUnit, mockDataset, mockEnrichedDataset, mockExcludedDataElements, mockDataBlocks;

            beforeEach(mocks.inject(function ($rootScope, $q) {
                rootScope = $rootScope;
                scope = rootScope.$new();
                q = $q;

                scope.resourceBundle = {
                    lastOneWeek: 'Last week',
                    lastFourWeeks: 'Last 4 weeks',
                    lastEightWeeks: 'Last 8 weeks',
                    lastTwelveWeeks: 'Last 12 weeks'
                };

                mockOrgUnit = {
                    id: 'orgUnitId'
                };
                mockDataset = {
                    id: 'selected dataset id'
                };

                mockEnrichedDataset = {
                    name: 'data set name',
                    sections: [{
                        id: 'section 1 id',
                        dataElements: [{
                            id: 'dataElementId'
                        }]
                    }, {
                        id: 'section 2 id',
                        dataElements: []
                    }, {
                        id: 'section 3 id',
                        dataElements: []
                    }]
                };

                mockDataBlocks = [{
                    period: '2016W01',
                    dataValues: [{
                        dataElement: 'deId1',
                        value: '3'
                    }, {
                        dataElement: 'deId1',
                        value: '2'
                    }, {
                        dataElement: 'deId2',
                        value: '6'
                    }]
                }, {
                    period: '2016W25',
                    dataValues: [{
                        dataElement: 'deId3',
                        value: '5'
                    }, {
                        dataElement: 'deId4',
                        value: '16'
                    }, {
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
                spyOn(datasetRepository, 'get').and.returnValue(utils.getPromise(q, mockDataset));
                spyOn(datasetRepository, 'includeDataElements').and.returnValue(utils.getPromise(q, [mockEnrichedDataset]));

                moduleDataBlockFactory = ModuleDataBlockFactory();
                spyOn(moduleDataBlockFactory, 'createForModule').and.returnValue(utils.getPromise(q, mockDataBlocks));

                excludedDataElementsRepository = new ExcludedDataElementsRepository();
                spyOn(excludedDataElementsRepository, 'get').and.returnValue(utils.getPromise(q, mockExcludedDataElements));

                controller = new ExportReportDataController(scope, q, datasetRepository, excludedDataElementsRepository, moduleDataBlockFactory);
            }));

            it('should fetch dataset object for the given dataset id', function () {
                scope.$apply();
                expect(datasetRepository.get).toHaveBeenCalledWith(mockDataset.id);
            });

            it('should fetch sections along with dataelements', function () {
                scope.$apply();
                expect(datasetRepository.includeDataElements).toHaveBeenCalledWith([mockDataset], _.map(mockExcludedDataElements.dataElements, 'id'));
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
        });
    });
