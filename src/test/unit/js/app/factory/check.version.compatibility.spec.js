define(['chromeUtils', 'systemSettingRepository', 'angularMocks', 'checkVersionCompatibility', 'utils'], function (chromeUtils, SystemSettingRepository, mocks, CheckVersionCompatibility, utils) {
    var systemSettingRepository, checkVersionCompatibility, q, rootScope;

    describe("Praxis version compatibility", function () {
        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            rootScope = $rootScope;

            systemSettingRepository = new SystemSettingRepository();
            checkVersionCompatibility = CheckVersionCompatibility(systemSettingRepository);

            spyOn(systemSettingRepository, "get").and.returnValue(utils.getPromise(q, ["5.1", "6.0"]));
            spyOn(chromeUtils, "getPraxisVersion").and.returnValue("5.0");
        }));

        it("should set incompatibleVersion to true if praxis version does not match the compatible versions in system settings", function () {
            chromeUtils.getPraxisVersion.and.returnValue("5.0");

            var compatibilityInfo = {};

            checkVersionCompatibility(compatibilityInfo);
            rootScope.$apply();

            expect(compatibilityInfo.incompatibleVersion).toBeTruthy();
        });

        it("should not set incompatibleVersion to true if the system settings do not contain the compatiblePraxisVersions entry in the object store", function () {
            systemSettingRepository.get.and.returnValue(utils.getPromise(q, []));

            var compatibilityInfo = {};

            checkVersionCompatibility(compatibilityInfo);
            rootScope.$apply();

            expect(systemSettingRepository.get).toHaveBeenCalledWith("compatiblePraxisVersions");
            expect(compatibilityInfo.incompatibleVersion).toBeFalsy();
        });

        it("should set newerVersionAvailable to false if there is no newer version of Praxis available", function () {
            chromeUtils.getPraxisVersion.and.returnValue("6.0");

            var compatibilityInfo = {};

            checkVersionCompatibility(compatibilityInfo);
            rootScope.$apply();

            expect(compatibilityInfo.newerVersionAvailable).toBeFalsy();
        });

        it("should set newerVersionAvailable to true if there is a newer version of Praxis available", function () {
            chromeUtils.getPraxisVersion.and.returnValue("5.1");

            var compatibilityInfo = {};

            checkVersionCompatibility(compatibilityInfo);
            rootScope.$apply();

            expect(compatibilityInfo.newerVersionAvailable).toBeTruthy();
            expect(compatibilityInfo.newerVersionNumber).toEqual('6.0');
        });

        it("should set incompatibleVersion to false if current version is greater than available praxis versions", function () {
            chromeUtils.getPraxisVersion.and.returnValue("7.0");

            var compatibilityInfo = {};

            checkVersionCompatibility(compatibilityInfo);
            rootScope.$apply();

            expect(compatibilityInfo.incompatibleVersion).toBeFalsy();
        });
    });
});