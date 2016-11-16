define(["dataSetTransformer", "testData", "dataEntryTableColumnConfig", "lodash"], function(datasetTransformer, testData, dataEntryTableColumnConfig, _) {
    describe("datasetTransformer", function() {
        var mockColumnConfigurations;

        beforeEach(function () {
            mockColumnConfigurations = [[{
                name: 'categoryOptionName1',
                categoryOptionComboId: 'categoryOptionComboIdA',
                excludeFromTotal: false
            }, {
                name: 'categoryOptionName2',
                categoryOptionComboId: 'categoryOptionComboIdB',
                excludeFromTotal: true
            }]];
            spyOn(dataEntryTableColumnConfig, 'generate').and.returnValue(mockColumnConfigurations);
        });

        describe('mapDatasetForView', function () {
            var createMockDataset = function (attributeValue) {
                return {
                    id: 'someDatasetId',
                    attributeValues: [attributeValue]
                };
            }, createMockAttribute = function (mockCode, mockValue) {
                return {
                    value: mockValue,
                    attribute: {
                        code: mockCode
                    }
                };
            };

            it("should set isAggregateService for aggregate dataset", function() {
                var linelistAttribute = createMockDataset('isLineListService', 'true');

                var aggregateDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(linelistAttribute));
                expect(aggregateDatasetForView.isAggregateService).toBeTruthy();
            });

            it("should set isLinelistService for linelist dataset", function() {
                var linelistAttribute = createMockAttribute('isLineListService', 'true');

                var linelistDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(linelistAttribute));
                expect(linelistDatasetForView.isLineListService).toBeTruthy();
            });

            it("should set isOriginDataSet on dataset", function() {
                var originAttribute = createMockAttribute('isOriginDataset', 'true');

                var originDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(originAttribute));
                expect(originDatasetForView.isOriginDataset).toBeTruthy();
            });

            it("should set isNewDataModel as false for dataset", function() {
                var newDataModelAttribute = createMockAttribute('isNewDataModel', 'false');

                var currentDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(newDataModelAttribute));
                expect(currentDatasetForView.isNewDataModel).toBeFalsy();
            });

            it("should set isReferralDataset ", function() {
                var referralAttribute = createMockAttribute('isReferralDataset', 'true');

                var referralDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(referralAttribute));
                expect(referralDatasetForView.isReferralDataset).toBeTruthy();
            });

            it("should map population dataset for view", function () {
                var populationAttribute = createMockAttribute('isPopulationDataset', 'true');

                var populationDatasetForView = datasetTransformer.mapDatasetForView(createMockDataset(populationAttribute));
                expect(populationDatasetForView.isPopulationDataset).toBeTruthy();
            });

            it('should set the serviceCode for view', function () {
                var serviceCodeAttribute = createMockAttribute('praxisServiceCode', 'someServiceCode');

                var reportServiceForView = datasetTransformer.mapDatasetForView(createMockDataset(serviceCodeAttribute));
                expect(reportServiceForView.serviceCode).toEqual('someServiceCode');
            });
        });

        describe('enrichWithSectionsAndDataElements', function () {
            var createMockAttribute = function(attributeCode, attributeValue) {
                return {
                    value: attributeValue,
                    attribute: {
                        code: attributeCode
                    }
                };
            };

            var createMockDataset = function (options) {
                return _.merge({
                    id: 'someDatasetId',
                    sections: [{
                        id: 'someSectionId'
                    }]
                }, options);
            };

            it("should enrich datasets with sections and dataelements", function() {

                var datasets = [createMockDataset()],
                sections = [{
                    id: 'someSectionId',
                    name: 'someName',
                    sortOrder: 'someSortOrder',
                    dataElements: [{
                        id: 'someDataElementId'
                    }]
                }],
                dataelements = [{
                    id: 'someDataElementId',
                    name: 'someName',
                    formName: 'someFormName',
                    categoryCombo: 'someComboId',
                    description: 'someDescription',
                    code: 'someCode'
                }];

                var actualEnrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(datasets, sections, dataelements);
                expect(actualEnrichedDatasets[0].sections[0].id).toEqual('someSectionId');
                expect(actualEnrichedDatasets[0].sections[0].sortOrder).toEqual('someSortOrder');
                expect(actualEnrichedDatasets[0].sections[0].dataElements[0].name).toEqual('someName');
                expect(actualEnrichedDatasets[0].sections[0].dataElements[0].formName).toEqual('someFormName');
                expect(actualEnrichedDatasets[0].sections[0].dataElements[0].categoryCombo).toEqual('someComboId');
                expect(actualEnrichedDatasets[0].sections[0].dataElements[0].description).toEqual('someDescription');
                expect(actualEnrichedDatasets[0].sections[0].dataElements[0].code).toEqual('someCode');
            });

            it("should set associated program ids on data elements where available", function () {
                var originDataset = createMockDataset(),
                    sections = [{
                        "id": "someSectionId",
                        "dataElements": [{
                            "id": "DE1"
                        }]
                    }],
                    dataElements = [{
                        "id": "DE1",
                        "attributeValues": [createMockAttribute('associatedProgram', 'someProgramId')]
                    }];

                var actualEnrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements([originDataset], sections, dataElements);
                expect(actualEnrichedDatasets[0].sections[0].dataElements[0].associatedProgramId).toEqual("someProgramId");
            });

            it('should set isIncluded on the dataelement and dataset', function () {
                var dataset = [createMockDataset()],
                    sections = [{ id: 'someSectionId', dataElements: [{ id: 'someDataElementId'}, {id: 'someOtherDataElementId'}]}],
                    dataelements = [{ id: 'someDataElementId'}, {id: 'someOtherDataElementId'}],
                    excludedDataElements = ['someOtherDataElementId'];
                
                var enrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(dataset, sections, dataelements, excludedDataElements);

                expect(enrichedDatasets[0].sections[0].isIncluded).toBeTruthy();
                expect(enrichedDatasets[0].sections[0].dataElements[0].isIncluded).toBeTruthy();
                expect(enrichedDatasets[0].sections[0].dataElements[1].isIncluded).toBeFalsy();
            });
            
            it('should set shouldHideTotals for dataElements and datasets', function () {
                var dataset = [createMockDataset()],
                    sections = [{ id: 'someSectionId', dataElements: [{ id: 'someDataElementId'}] }],
                    dataelements = [{ id: 'someDataElementId', attributeValues: [createMockAttribute('hideAggregateDataSetSectionTotals', 'true')] }];

                var enrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(dataset, sections, dataelements);

                expect(enrichedDatasets[0].sections[0].shouldHideTotals).toBeTruthy();
                expect(enrichedDatasets[0].sections[0].dataElements[0].shouldHideTotals).toBeTruthy();
            });

            it('should set the subsection to a data elements', function () {
                var dataset = [createMockDataset()],
                    sections = [{ id: 'someSectionId', dataElements: [{ id: 'someDataElementId'} , { id: 'someOtherDataElementId'}] }],
                    dataelements = [{ id: 'someDataElementId' }, {id: 'someOtherDataElementId'}],
                    dataElementGroups = [{
                        id: 'someDataElementGroupId',
                        name: 'someDataElementGroupName',
                        dataElements: [{
                            id: 'someDataElementId'
                        }]
                    }];

                var enrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(dataset, sections, dataelements, [], dataElementGroups);
                expect(enrichedDatasets[0].sections[0].dataElements[0].subSection).toEqual('someDataElementGroupName');
                expect(enrichedDatasets[0].sections[0].dataElements[1].subSection).toEqual('Default');
            });

            it('should set population data element codes to data elements', function () {
                var dataset = [createMockDataset()],
                    sections = [{ id: 'someSectionId', dataElements: [{ id: 'someDataElementId'} ] }],
                    dataelements = [{ id: 'someDataElementId' , attributeValues: [createMockAttribute('praxisPopulationDataElements', 'someElementType')]}];

                var enrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(dataset, sections, dataelements);
                expect(enrichedDatasets[0].sections[0].dataElements[0].populationDataElementCode).toEqual('someElementType');
            });
        });

        it("should enrich datasets with column configurations", function() {
            var dataSets = [{
                sections: [{
                    dataElements: [{
                        categoryCombo: {
                            id: 'CC1'
                        }
                    }]
                }]
            }];

            var allCategoryCombos = testData.get('categoryCombos');
            var allCategories = testData.get('categories');
            var allCategoryOptionCombos = testData.get('categoryOptionCombos');
            var enrichedDatasets = datasetTransformer.enrichWithColumnConfigurations(dataSets, allCategoryCombos, allCategories, allCategoryOptionCombos);

            var expectedCategoryOptionCombos = _.filter(allCategoryOptionCombos, { categoryCombo: { id: 'CC1' } });
            expect(dataEntryTableColumnConfig.generate).toHaveBeenCalledWith(allCategories, expectedCategoryOptionCombos);

            expect(enrichedDatasets[0].sections[0].columnConfigurations).toEqual(mockColumnConfigurations);
            expect(enrichedDatasets[0].sections[0].baseColumnConfiguration).toEqual(_.last(mockColumnConfigurations));
            expect(enrichedDatasets[0].sections[0].categoryOptionComboIdsForTotals).toEqual([mockColumnConfigurations[0][0].categoryOptionComboId]);
        });

        it("should enrich data elements with the dataElement Group", function() {

            var datasets, sections, dataelements;
            var allDataSetsFromTestData = testData.get("dataSets");
            datasets = [allDataSetsFromTestData[0], allDataSetsFromTestData[1]];
            sections = testData.get("sections");
            dataelements = testData.get("dataElements");
            var dataElementGroups = [{
                'name': 'Group 1',
                'dataElements': [{
                    'id': "DE1"
                }]
            }];

            var actualEnrichedDatasets = datasetTransformer.enrichWithSectionsAndDataElements(datasets, sections, dataelements, ['DE3'], dataElementGroups);
            expect(actualEnrichedDatasets.length).toBe(2);
            expect(actualEnrichedDatasets[0].sections[0].dataElements[0].subSection).toBe('Group 1');
            expect(actualEnrichedDatasets[0].sections[0].dataElements[1].subSection).toBe('Default');

        });
    });
});
