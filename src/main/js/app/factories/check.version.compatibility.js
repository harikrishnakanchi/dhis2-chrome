define(['chromeUtils', 'lodash'], function (chromeUtils, _) {
    return function (systemSettingRepository) {

        var versionStringComparator = function (a, b) {
            var i, diff;
            var regExStrip0 = /(\.0+)+$/;
            var segmentsA = a.replace(regExStrip0, '').split('.');
            var segmentsB = b.replace(regExStrip0, '').split('.');
            var l = Math.min(segmentsA.length, segmentsB.length);

            for (i = 0; i < l; i++) {
                diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
                if (diff) {
                    return diff;
                }
            }
            return segmentsA.length - segmentsB.length;
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
                    var latestVersion = _.last(compatiblePraxisVersions.sort(versionStringComparator));
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