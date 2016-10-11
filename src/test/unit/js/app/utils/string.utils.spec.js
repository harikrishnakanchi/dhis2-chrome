define(['stringUtils'], function (stringUtils) {
    describe('stringUtils', function () {
        it('should replace the special character <', function () {
            expect(stringUtils.replaceSpecialCharacters('<2 years')).toEqual('˂2 years');
        });

        it('should replace the special character >', function () {
            expect(stringUtils.replaceSpecialCharacters('>2 years')).toEqual('˃2 years');
        });

        it('should return if the string is undefined', function () {
            expect(stringUtils.replaceSpecialCharacters(undefined)).toBeUndefined();
        });
    });
});