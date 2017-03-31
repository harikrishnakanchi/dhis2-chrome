define(["sjcl", "properties"], function(sjcl, properties) {

    var createCipherText = function(productKey) {
        var cipherDetails = JSON.parse(atob(productKey));

        return JSON.stringify({
            "iv": cipherDetails.iv,
            "salt": cipherDetails.salt,
            "ct": cipherDetails.ct,
            "iter": properties.encryption.iter,
            "ks": properties.encryption.ks,
            "ts": properties.encryption.ts,
            "mode": properties.encryption.mode,
            "cipher": properties.encryption.cipher
        });
    };

    var decrypt = function(text) {
        return sjcl.decrypt(properties.encryption.passphrase, createCipherText(text));
    };

    var generateSHA256 = function (message) {
        var bitArray = sjcl.hash.sha256.hash(message);
        var digest_sha256 = sjcl.codec.hex.fromBits(bitArray);

        return digest_sha256;
    };

    return {
        "decrypt": decrypt,
        "generateSHA256": generateSHA256
    };
});
