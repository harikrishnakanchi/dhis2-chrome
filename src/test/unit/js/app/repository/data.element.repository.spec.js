define(["dataElementRepository", "angularMocks", "utils", "customAttributes"], function(DataElementRepository, mocks, utils, CustomAttributes) {
    describe("data element repository", function() {
        var db, mockStore, dataElementRepository, scope, q, mockAttributeValue;
        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            var mockDB = utils.getMockDB($q);
            scope = $rootScope.$new();
            mockStore = mockDB.objectStore;
            mockAttributeValue = "age"+ _.random(1,100);
            spyOn(CustomAttributes, 'getAttributeValue').and.returnValue(mockAttributeValue);
            dataElementRepository = new DataElementRepository(mockDB.db);
        }));

        describe('get', function() {

            it('should get for the given data element id', function () {
                var dataElementId = "someDataElementId";
                dataElementRepository.get(dataElementId);
                expect(mockStore.find).toHaveBeenCalled();
            });

            it('should add offlineSummaryType custom attribute to DataElement', function () {
                var dataElementId = "someDataElementId";
                var mockDataElement = {
                    attributeValues: []
                };
                mockStore.find.and.returnValue(utils.getPromise(q, mockDataElement));

                var dataElement;
                dataElementRepository.get(dataElementId).then(function (de) {
                    dataElement = de;
                });
                scope.$apply();

                expect(CustomAttributes.getAttributeValue).toHaveBeenCalledWith(mockDataElement.attributeValues, CustomAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
                expect(dataElement.offlineSummaryType).toEqual(mockAttributeValue);
            });

        });

        describe('findAll', function() {

            it('should get all data elements for the list of data elements', function() {
                var dataElementIds = ["someDataElem1", "someDataElem2"];

                dataElementRepository.findAll(dataElementIds);

                expect(mockStore.each).toHaveBeenCalled();
            });

            it('should add offlineSummaryType custom attribute to DataElement', function() {
                var dataElementIds = ["someDataElem1", "someDataElem2"];
                var mockDataElement = {
                    attributeValues: []
                };
                mockStore.each.and.returnValue(utils.getPromise(q, [mockDataElement]));

                var actualDataElements;
                dataElementRepository.findAll(dataElementIds).then(function (dataElements) {
                    actualDataElements = dataElements;
                });
                scope.$apply();

                expect(CustomAttributes.getAttributeValue).toHaveBeenCalledWith(mockDataElement.attributeValues, CustomAttributes.LINE_LIST_OFFLINE_SUMMARY_CODE);
                expect(actualDataElements).toEqual([{
                    attributeValues: [],
                    offlineSummaryType: mockAttributeValue
                }]);
            });
        });

    });
});