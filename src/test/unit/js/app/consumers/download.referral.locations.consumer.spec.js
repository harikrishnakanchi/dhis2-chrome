define(["downloadReferralLocationsConsumer", "systemSettingService", "referralLocationsRepository", "orgUnitRepository", "mergeBy", "utils", "angularMocks", "lodash"],
    function(DownloadReferralLocationsConsumer, SystemSettingService, ReferralLocationsRepository, OrgUnitRepository, MergeBy, utils, mocks, _) {
        describe("downloadReferralLocationsConsumer", function() {
            var consumer,
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

                var mockOpUnits = [
                    { "id": "someOpUnitId" }
                ];
                var mockDhisReferralLocations = [
                    {
                        "id": "someOpUnitId",
                        "Facility 1": "Alias for Facility 1"
                    }
                ];

                spyOn(orgUnitRepository, "getAllOperationUnits").and.returnValue(utils.getPromise(q, mockOpUnits));
                spyOn(systemSettingService, "getReferralLocations").and.returnValue(utils.getPromise(q, mockDhisReferralLocations));
                spyOn(referralLocationsRepository, "findAll").and.returnValue(utils.getPromise(q, []));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));

                consumer = new DownloadReferralLocationsConsumer(systemSettingService, orgUnitRepository, referralLocationsRepository, mergeBy, q);
            }));

            it("should download referral locations from dhis", function() {
                var opUnits = [
                    { "id": "opUnit1" },
                    { "id": "opUnit2" }
                ];
                var dhisReferralLocations = [
                    {
                        "id": "opUnit1",
                        "Facility 1": "Some alias"
                    }
                ];
                orgUnitRepository.getAllOperationUnits.and.returnValue(utils.getPromise(q, opUnits));
                systemSettingService.getReferralLocations.and.returnValue(utils.getPromise(q, dhisReferralLocations));

                consumer.run();
                scope.$apply();

                expect(systemSettingService.getReferralLocations).toHaveBeenCalledWith(["opUnit1", "opUnit2"]);
                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(dhisReferralLocations);
            });

            it("should not call upsert on the referralLocationsRepository if there is nothing to save", function() {
                var dhisReferralLocations = [];
                systemSettingService.getReferralLocations.and.returnValue(utils.getPromise(q, dhisReferralLocations));

                consumer.run();
                scope.$apply();

                expect(referralLocationsRepository.upsert).not.toHaveBeenCalled();
            });

            it("should download referral locations in batches", function() {
                var opUnits = _.map(new Array(21), function(opUnit, index) {
                    return { "id": "opUnit" + index };
                });
                orgUnitRepository.getAllOperationUnits.and.returnValue(utils.getPromise(q, opUnits));

                consumer.run();
                scope.$apply();

                expect(systemSettingService.getReferralLocations.calls.count()).toEqual(2);
                expect(referralLocationsRepository.upsert.calls.count()).toEqual(2);
            });

            it("should overwrite local referral locations with dhis copy only when referral locations are newer in dhis", function() {
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

                systemSettingService.getReferralLocations.and.returnValue(utils.getPromise(q, dhisReferralLocations));
                referralLocationsRepository.findAll.and.returnValue(utils.getPromise(q, localReferralLocations));

                consumer.run();
                scope.$apply();

                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(expectedMergedReferralLocations);
            });

        });
});
