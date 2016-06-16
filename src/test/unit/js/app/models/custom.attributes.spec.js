define(['customAttributes'], function(CustomAttributes) {
    describe('CustomAttributes', function() {
        describe('parseAttribute', function() {
            var attributeValues;

            it('should return true if the corresponding attribute value is true', function() {
                attributeValues = [{
                    attribute: {
                        code: 'attributeCode'
                    },
                    value: 'true'
                }];
                expect(CustomAttributes.parseAttribute(attributeValues, 'attributeCode')).toEqual(true);
            });

            it('should return false if there is no corresponding attribute value', function() {
                attributeValues = [];
                expect(CustomAttributes.parseAttribute(attributeValues, 'attributeCode')).toEqual(false);
            });

            it('should return false if the corresponding attribute value is not true', function() {
                attributeValues = [{
                    attribute: {
                        code: 'attributeCode'
                    },
                    value: 'invalidValue'
                }];
                expect(CustomAttributes.parseAttribute(attributeValues, 'attributeCode')).toEqual(false);
            });
        });
    });
});