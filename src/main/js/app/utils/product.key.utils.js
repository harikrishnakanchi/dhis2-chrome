define(['cipherUtils'], function (cipherUtils) {
    var decrypt = function (productKey) {
        try{
            return JSON.parse(cipherUtils.decrypt(productKey));
        }
        catch (e) {
            return false;
        }
    };
    return {
        decrypt: decrypt
    };
});