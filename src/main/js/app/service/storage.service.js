define(['sjcl', 'moment'], function (sjcl, moment) {
    return function ($window) {
        var generateHashedKey = function (key) {
            key += moment().startOf('day').valueOf();

            var bitArray = sjcl.hash.sha256.hash(key);
            return sjcl.codec.hex.fromBits(bitArray);
        };

        this.setItem = function (key, value) {
            var hashedKey = generateHashedKey(key);

            var encryptedValue = sjcl.encrypt(hashedKey, JSON.stringify(value));
            $window.sessionStorage.setItem(hashedKey, btoa(encryptedValue));
        };

        this.getItem = function (key) {
            var hashedKey = generateHashedKey(key);
            try {
                return JSON.parse(sjcl.decrypt(hashedKey, atob($window.sessionStorage.getItem(hashedKey))));
            } catch (e) {
                return null;
            }
        };

        this.clear = function () {
            $window.sessionStorage.clear();
        };

        this.removeItem = function (key) {
            var hashedKey = generateHashedKey(key);
            $window.sessionStorage.removeItem(hashedKey);
        };
    };
});
