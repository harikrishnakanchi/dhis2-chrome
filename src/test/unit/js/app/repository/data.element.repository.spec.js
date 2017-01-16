define(["dataElementRepository", "angularMocks", "utils", "customAttributes"], function(DataElementRepository, mocks, utils, customAttributes) {
    describe("data element repository", function() {
        var mockDb, mockStore, dataElementRepository, scope, q, mockAttributeValue;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();

            mockDb = utils.getMockDB($q);
            mockStore = mockDb.objectStore;

            mockAttributeValue = 'mockAttributeValue';
            spyOn(customAttributes, 'getAttributeValue').and.returnValue(mockAttributeValue);
            spyOn(customAttributes, 'getBooleanAttributeValue').and.returnValue(mockAttributeValue);

            dataElementRepository = new DataElementRepository(mockDb.db);
        }));

        describe('get', function() {
            var dataElementId, mockDataElement;

            beforeEach(function () {
                dataElementId = "someDataElementId";
                mockDataElement = {
                    attributeValues: 'someAttributeValues'
                };
                mockStore.find.and.returnValue(utils.getPromise(q, mockDataElement));

            });

            it('should get for the given data element id', function () {
                dataElementRepository.get(dataElementId);
                expect(mockStore.find).toHaveBeenCalled();
            });

            it('should add offlineSummaryType custom attribute to DataElement', function () {
                dataElementRepository.get(dataElementId).then(function (dataElement) {
                    expect(dataElement.offlineSummaryType).toEqual(mockAttributeValue);
                });

                scope.$apply();
                expect(customAttributes.getAttributeValue).toHaveBeenCalledWith(mockDataElement.attributeValues, customAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
            });

            it('should add showInEventSummary custom attribute to DataElement', function () {
                dataElementRepository.get(dataElementId).then(function (dataElement) {
                    expect(dataElement.showInEventSummary).toEqual(mockAttributeValue);
                });

                scope.$apply();
                expect(customAttributes.getBooleanAttributeValue).toHaveBeenCalledWith(mockDataElement.attributeValues, customAttributes.SHOW_IN_EVENT_SUMMARY_CODE);
            });

        });

        describe('findAll', function() {
            it('should get all data elements for the list of data elements', function() {
                var dataElementIds = ["someDataElem1", "someDataElem2"];

                dataElementRepository.findAll(dataElementIds);

                expect(mockStore.each).toHaveBeenCalled();
            });
        });

        describe('enrichDataElements', function () {
            it('should enrich the data element', function () {
                var dataElement = {
                    id: 'someDataElementId'
                };
                var dataElements = [{
                    id: 'someDataElementId',
                    name: 'someName',
                    formName: 'formName',
                    description: 'someDescription',
                    someOtherFields: 'someOtherFields'
                }];

                spyOn(dataElementRepository, 'findAll').and.returnValue(utils.getPromise(q, dataElements));

                var expectedDataElements = {
                    id: 'someDataElementId',
                    name: 'someName',
                    formName: 'formName',
                    description: 'someDescription'
                };
                dataElementRepository.enrichWithDataElementsDetails([dataElement]).then(function (enrichedDataElements) {
                    expect(dataElementRepository.findAll).toHaveBeenCalledWith([dataElement.id]);
                    expect(dataElement).toEqual(expectedDataElements);
                });
                scope.$apply();
            });
        });

    });
});