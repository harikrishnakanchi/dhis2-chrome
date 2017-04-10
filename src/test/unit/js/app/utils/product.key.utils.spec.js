define(['productKeyUtils', 'cipherUtils'], function (productKeyUtils, cipherUtils) {
    describe('productKeyUtils', function () {
        var mockProductKeyDetails;
        beforeEach(function () {
            mockProductKeyDetails = {
                "data": {
                    "authHeader": "fakeAuthHeader",
                    "dhisUrl": "url",
                    "productKeyLevel": "level",
                    "allowedOrgUnits": [{id: "IDA"}]
                },
                "keyGeneratedFromProd": false,
                "version": "1.0"
            };
            spyOn(cipherUtils, 'decrypt').and.returnValue(JSON.stringify(mockProductKeyDetails));
        });

        it('should decrypt productKey', function () {
            var mockProductKey = "aaabcd==";
            productKeyUtils.decrypt(mockProductKey);

            expect(cipherUtils.decrypt).toHaveBeenCalledWith(mockProductKey);
        });

        it('should parse the string and return object', function () {
            var mockProductKey = "aaabcd==";
            var actualValue = productKeyUtils.decrypt(mockProductKey);

            expect(actualValue).toEqual(mockProductKeyDetails);
        });
    });
});