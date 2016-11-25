define(['customAttributes'], function(customAttributes) {
    describe('customAttributes', function() {
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
                expect(customAttributes.getBooleanAttributeValue(attributeValues, 'attributeCode')).toEqual(true);
            });

            it('should return false if there is no corresponding attribute value', function() {
                attributeValues = [];
                expect(customAttributes.getBooleanAttributeValue(attributeValues, 'attributeCode')).toEqual(false);
            });

            it('should return false if the corresponding attribute value is not true', function() {
                attributeValues = [mockAttributeValue('attributeCode', 'invalidValue')];
                expect(customAttributes.getBooleanAttributeValue(attributeValues, 'attributeCode')).toEqual(false);
            });
        });

        describe('getAttributeValue', function() {
            it('should return corresponding attribute value', function() {
                attributeValues = [mockAttributeValue('attributeCode', 'validValue')];
                expect(customAttributes.getAttributeValue(attributeValues, 'attributeCode')).toEqual("validValue");
            });

            it('should return undefined if corresponding attribute value does not exist and no default value given', function() {
                attributeValues = [];
                expect(customAttributes.getAttributeValue(attributeValues, 'attributeCode')).toBeUndefined();
            });

            it('should return the default value if the corresponding attribute value does not exist', function () {
                var defaultValue = 10, expectedValue = 10;
                attributeValues = [];
                expect(customAttributes.getAttributeValue(attributeValues, 'attributeCode', defaultValue)).toBe(expectedValue);
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
                expect(customAttributes.cleanAttributeValues(attributeValues)).toEqual([]);
            });

            it('should keep attribute values whose value is valid', function () {
                attributeValues = [mockAttributeValue('attributeCode', 'someValue')];
                expect(customAttributes.cleanAttributeValues(attributeValues)).toEqual(attributeValues);
            });
        });
    });
});