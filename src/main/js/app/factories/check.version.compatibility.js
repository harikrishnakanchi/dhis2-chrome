define(['chromeUtils', 'lodash'], function (chromeUtils, _) {
    return function (systemSettingRepository) {

        var versionStringComparator = function (v1, v2) {
            v1 = v1.split(".");
            v2 = v2.split(".");
            var l = Math.min(v1.length, v2.length);
            for (var i = 0; i < l; i++) {
                var a = parseInt(v1[i]);
                var b = parseInt(v2[i]);
                if (a < b) {
                    return -1;
                } else if (a > b) {
                    return 1;
                }
            }
            return 0;
        };

        return function (compatibilityInfo) {
            var checkCompatibility = function (compatiblePraxisVersions) {
                var praxisVersion = chromeUtils.getPraxisVersion();

                compatibilityInfo.incompatibleVersion = !_.contains(compatiblePraxisVersions, praxisVersion);

                if (compatibilityInfo.incompatibleVersion) {
                    var alreadyOnLatestVersion = _.last(compatiblePraxisVersions.concat(praxisVersion).sort(versionStringComparator)) == praxisVersion;
                    if (alreadyOnLatestVersion) {
                        compatibilityInfo.incompatibleVersion = false;
                        compatibilityInfo.newerVersionAvailable = false;
                    }
                } else {
                    var latestVersion = _.max(compatiblePraxisVersions, function (version) {
                        return parseFloat(version);
                    });
                    if (praxisVersion != latestVersion) {
                        compatibilityInfo.newerVersionAvailable = true;
                        compatibilityInfo.newerVersionNumber = latestVersion;
                    }
                }
            };

            var objectStoreNotFound = function () {
                compatibilityInfo.incompatibleVersion = false;
                compatibilityInfo.newerVersionAvailable = false;
            };

            return systemSettingRepository.get("compatiblePraxisVersions")
                .then(checkCompatibility, objectStoreNotFound);
        };
    };
});