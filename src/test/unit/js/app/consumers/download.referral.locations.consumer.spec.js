define(["downloadReferralLocationsConsumer", "systemSettingService", "referralLocationsRepository", "orgUnitRepository", "utils", "angularMocks", "lodash"],
    function(DownloadReferralLocationsConsumer, SystemSettingService, ReferralLocationsRepository, OrgUnitRepository, utils, mocks, _) {
        describe("downloadReferralLocationsConsumer", function() {
            var downloadReferralLocationsConsumer,
                systemSettingService,
                referralLocationsRepository,
                orgUnitRepository,
                q,
                scope;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                systemSettingService = new SystemSettingService();
                referralLocationsRepository = new ReferralLocationsRepository();
                orgUnitRepository = new OrgUnitRepository();

            }));

            it("should download referral locations from dhis", function() {
                var opUnits = [
                    { "id": "opUnit1" },
                    { "id": "opUnit2" }
                ];
                var referralLocations = [
                    {
                        "id": "opUnit1",
                        "Facility 1": "Some alias"
                    }
                ];
                spyOn(orgUnitRepository, "getAllOperationUnits").and.returnValue(utils.getPromise(q, opUnits));
                spyOn(systemSettingService, "getReferralLocations").and.returnValue(utils.getPromise(q, referralLocations));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                downloadReferralLocationsConsumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, q);
                downloadReferralLocationsConsumer.run();
                scope.$apply();

                expect(systemSettingService.getReferralLocations).toHaveBeenCalledWith(["opUnit1", "opUnit2"]);
                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(referralLocations);
            });

            it("should not call upsert on the referralLocationsRepository if there is nothing to save", function() {
                var opUnits = [
                    { "id": "opUnit1" },
                    { "id": "opUnit2" }
                ];
                var referralLocations = [];
                spyOn(orgUnitRepository, "getAllOperationUnits").and.returnValue(utils.getPromise(q, opUnits));
                spyOn(systemSettingService, "getReferralLocations").and.returnValue(utils.getPromise(q, referralLocations));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                downloadReferralLocationsConsumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, q);
                downloadReferralLocationsConsumer.run();
                scope.$apply();

                expect(referralLocationsRepository.upsert).not.toHaveBeenCalled();
            });

            it("should download referral locations in batches", function() {
                var opUnits = _.map(new Array(21), function(opUnit, index) {
                    return { "id": "opUnit" + index };
                });
                var referralLocations = [
                    { "id": "opUnit1" }
                ];
                spyOn(orgUnitRepository, "getAllOperationUnits").and.returnValue(utils.getPromise(q, opUnits));
                spyOn(systemSettingService, "getReferralLocations").and.returnValue(utils.getPromise(q, referralLocations));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                downloadReferralLocationsConsumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, q);
                downloadReferralLocationsConsumer.run();
                scope.$apply();

                expect(systemSettingService.getReferralLocations.calls.count()).toEqual(2);
                expect(referralLocationsRepository.upsert.calls.count()).toEqual(2);
            });

        });
});
