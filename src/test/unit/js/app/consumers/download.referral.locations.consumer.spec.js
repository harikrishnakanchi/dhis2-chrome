define(["downloadReferralLocationsConsumer", "systemSettingService", "referralLocationsRepository", "orgUnitRepository", "mergeBy", "utils", "angularMocks", "lodash"],
    function(DownloadReferralLocationsConsumer, SystemSettingService, ReferralLocationsRepository, OrgUnitRepository, MergeBy, utils, mocks, _) {
        describe("downloadReferralLocationsConsumer", function() {
            var downloadReferralLocationsConsumer,
                systemSettingService,
                referralLocationsRepository,
                orgUnitRepository,
                mergeBy,
                q,
                scope;

            beforeEach(mocks.inject(function($q, $rootScope, $log) {
                q = $q;
                mergeBy = new MergeBy($log);
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
                spyOn(referralLocationsRepository, "findAll").and.returnValue(utils.getPromise(q, []));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                downloadReferralLocationsConsumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, mergeBy, q);
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
                spyOn(referralLocationsRepository, "findAll").and.returnValue(utils.getPromise(q, []));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                downloadReferralLocationsConsumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, mergeBy, q);
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
                spyOn(referralLocationsRepository, "findAll").and.returnValue(utils.getPromise(q, []));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                downloadReferralLocationsConsumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, mergeBy, q);
                downloadReferralLocationsConsumer.run();
                scope.$apply();

                expect(systemSettingService.getReferralLocations.calls.count()).toEqual(2);
                expect(referralLocationsRepository.upsert.calls.count()).toEqual(2);
            });

            it("should overwrite local referral locations with dhis copy only when referral locations are newer in dhis", function() {
                var opUnits = [{
                    "id": "opUnit1"
                },{
                    "id": "opUnit2"
                }];
                var localReferralLocations = [{
                    'id': 'opUnit1',
                    'clientLastUpdated': '2015-01-01T09:00:00.000+0000',
                },{
                    'id': 'opUnit2',
                    'clientLastUpdated': '2015-01-01T09:00:00.000+0000',
                }];

                var dhisReferralLocations = [{
                    'id': 'opUnit1',
                    'clientLastUpdated': '2015-01-01T10:00:00.000+0000',
                },{
                    'id': 'opUnit2',
                    'clientLastUpdated': '2015-01-01T08:00:00.000+0000',
                }];

                var expectedMergedReferralLocations = [
                    dhisReferralLocations[0],
                    localReferralLocations[1]
                ];

                spyOn(orgUnitRepository, "getAllOperationUnits").and.returnValue(utils.getPromise(q, opUnits));
                spyOn(systemSettingService, "getReferralLocations").and.returnValue(utils.getPromise(q, dhisReferralLocations));
                spyOn(referralLocationsRepository, "findAll").and.returnValue(utils.getPromise(q, localReferralLocations));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                downloadReferralLocationsConsumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, mergeBy, q);
                downloadReferralLocationsConsumer.run();
                scope.$apply();

                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(expectedMergedReferralLocations);
            });

        });
});
