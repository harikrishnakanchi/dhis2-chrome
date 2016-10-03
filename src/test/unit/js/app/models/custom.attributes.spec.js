define(['customAttributes'], function(CustomAttributes) {
    describe('CustomAttributes', function() {
        var attributeValues;

        var mockAttributeValue = function (attributeCode, value) {
            return {
                attribute: {
                    code: attributeCode
                },
                value: value
            };
        };

        describe('getBooleanAttributeValue', function() {


            it('should return true if the corresponding attribute value is true', function() {
                attributeValues = [mockAttributeValue('attributeCode', 'true')];
                expect(CustomAttributes.getBooleanAttributeValue(attributeValues, 'attributeCode')).toEqual(true);
            });

            it('should return false if there is no corresponding attribute value', function() {
                attributeValues = [];
                expect(CustomAttributes.getBooleanAttributeValue(attributeValues, 'attributeCode')).toEqual(false);
            });

            it('should return false if the corresponding attribute value is not true', function() {
                attributeValues = [mockAttributeValue('attributeCode', 'invalidValue')];
                expect(CustomAttributes.getBooleanAttributeValue(attributeValues, 'attributeCode')).toEqual(false);
            });
        });

        describe('getAttributeValue', function() {
            it('should return corresponding attribute value', function() {
                attributeValues = [mockAttributeValue('attributeCode', 'validValue')];
                expect(CustomAttributes.getAttributeValue(attributeValues, 'attributeCode')).toEqual("validValue");
            });

            it('should return undefined if corresponding attribute value does not exist', function() {
                attributeValues = [];
                expect(CustomAttributes.getAttributeValue(attributeValues, 'attributeCode')).toBeUndefined();
            });
        });

        describe('cleanAttributeValues', function () {
            it('should clean attribute values whose value is invalid', function () {
                attributeValues = [
                    mockAttributeValue('attributeCode', undefined),
                    mockAttributeValue('attributeCode', null),
                    mockAttributeValue('attributeCode', NaN),
                    mockAttributeValue('attributeCode', '')
                ];
                expect(CustomAttributes.cleanAttributeValues(attributeValues)).toEqual([]);
            });

            it('should keep attribute values whose value is valid', function () {
                attributeValues = [mockAttributeValue('attributeCode', 'someValue')];
                expect(CustomAttributes.cleanAttributeValues(attributeValues)).toEqual(attributeValues);
            });
        });
    });
});