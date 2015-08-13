define(["uploadReferralLocationsConsumer", "utils", "angularMocks", "systemSettingService", "referralLocationsRepository"],
    function(UploadReferralLocationsConsumer, utils, mocks, SystemSettingService, ReferralLocationsRepository) {
        describe("uploadReferralLocationsConsumer", function() {
            var uploadReferralLocationsConsumer, systemSettingService, referralLocationsRepository, q, scope;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                systemSettingService = new SystemSettingService();
                referralLocationsRepository = new ReferralLocationsRepository();

            }));

            it("should save referral locations to dhis", function() {
                var referralLocations = { "Facility 1" : "abc" };
                var message = {
                    "data": {
                        "data" : "opUnitId"
                    }
                };

                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, referralLocations));
                spyOn(systemSettingService, "upsertReferralLocations").and.returnValue(utils.getPromise(q, {}));

                uploadReferralLocationsConsumer = new UploadReferralLocationsConsumer(systemSettingService, referralLocationsRepository);
                uploadReferralLocationsConsumer.run(message);
                scope.$apply();

                expect(referralLocationsRepository.get).toHaveBeenCalledWith("opUnitId");
                expect(systemSettingService.upsertReferralLocations).toHaveBeenCalledWith(referralLocations);
            });
        });
});
