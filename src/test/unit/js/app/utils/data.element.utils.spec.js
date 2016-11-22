define(['dataElementUtils'], function (dataElementUtils) {
    describe('dataElementUtils', function () {
        describe('getDisplayName', function () {

            it('should return the formName as the display name for a data element', function () {
                var dataElement = {
                    formName: 'someFormName'
                };
                var displayName = dataElementUtils.getDisplayName(dataElement);
                expect(displayName).toEqual(dataElement.formName);
            });

            it('should return the name as the display name if formName is not present', function () {
                var dataElement = {
                    name: 'someName'
                };
                var displayName = dataElementUtils.getDisplayName(dataElement);
                expect(displayName).toEqual(dataElement.name);
            });
        });
    });
});
