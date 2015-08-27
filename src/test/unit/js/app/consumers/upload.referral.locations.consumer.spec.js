define(["uploadReferralLocationsConsumer", "utils", "angularMocks", "systemSettingService", "referralLocationsRepository", "orgUnitRepository"],
    function(UploadReferralLocationsConsumer, utils, mocks, SystemSettingService, ReferralLocationsRepository, OrgUnitRepository) {
        describe("uploadReferralLocationsConsumer", function() {
            var uploadReferralLocationsConsumer, systemSettingService, referralLocationsRepository, orgUnitRepository, q, scope;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                systemSettingService = new SystemSettingService();
                referralLocationsRepository = new ReferralLocationsRepository();
                orgUnitRepository = new OrgUnitRepository();
            }));

            it("should save referral locations to dhis", function() {
                var project = {
                    "id": "prj1"
                };

                var referralLocations = {
                    "id": "opUnit1",
                    "facility 1": {
                        "value": "some alias",
                        "isDisabled": true
                    },
                    "facility 2": {
                        "value": "some other alias"
                    },
                    "clientLastUpdated": "2015-07-17T07:00:00.000Z"
                };

                var message = {
                    "data": {
                        "data": "opUnitId"
                    }
                };

                spyOn(orgUnitRepository, "getParentProject").and.returnValue(utils.getPromise(q, project));
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, referralLocations));
                spyOn(systemSettingService, "upsertReferralLocations").and.returnValue(utils.getPromise(q, {}));

                uploadReferralLocationsConsumer = new UploadReferralLocationsConsumer(q, systemSettingService, referralLocationsRepository, orgUnitRepository);
                uploadReferralLocationsConsumer.run(message);
                scope.$apply();

                expect(orgUnitRepository.getParentProject).toHaveBeenCalledWith("opUnitId");
                expect(referralLocationsRepository.get).toHaveBeenCalledWith("opUnitId");
                expect(systemSettingService.upsertReferralLocations).toHaveBeenCalledWith(project.id, referralLocations);
            });
        });
    });
