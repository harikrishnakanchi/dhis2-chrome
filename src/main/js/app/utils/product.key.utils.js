define(['cipherUtils'], function (cipherUtils) {
    var decrypt = function (productKey) {
        return JSON.parse(cipherUtils.decrypt(productKey));
    };
    return {
        decrypt: decrypt
    };
});