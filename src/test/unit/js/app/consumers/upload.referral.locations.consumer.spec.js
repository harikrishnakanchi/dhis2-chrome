define(["uploadReferralLocationsConsumer", "utils", "angularMocks", "dataStoreService", "referralLocationsRepository"],
    function(UploadReferralLocationsConsumer, utils, mocks, DataStoreService, ReferralLocationsRepository) {
        describe("uploadReferralLocationsConsumer", function() {
            var uploadReferralLocationsConsumer, dataStoreService, referralLocationsRepository, q, scope, mockMessage, http, localReferralLocations;

            beforeEach(mocks.inject(function($q, $rootScope, $http) {
                q = $q;
                scope = $rootScope.$new();
                http = $http;
                mockMessage = {
                    "data": {
                        "data": "opUnit1",
                        "type": "uploadReferralLocations"
                    }
                };
                localReferralLocations = {
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

                dataStoreService = new DataStoreService(http, q);
                spyOn(dataStoreService, "updateReferrals").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataStoreService, "createReferrals").and.returnValue(utils.getPromise(q, {}));
                spyOn(dataStoreService, "getReferrals").and.returnValue(utils.getPromise(q, undefined));

                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, localReferralLocations));
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, undefined));

                uploadReferralLocationsConsumer = new UploadReferralLocationsConsumer(q, dataStoreService, referralLocationsRepository);
            }));

            it("should get referral locations for specified opUnit from dhis", function() {
                uploadReferralLocationsConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.getReferrals).toHaveBeenCalledWith(["opUnit1"]);
            });

            it('should get local referral locations', function () {
                uploadReferralLocationsConsumer.run(mockMessage);
                scope.$apply();

                expect(referralLocationsRepository.get).toHaveBeenCalledWith("opUnit1");
            });

            it('should upload referral locations to DHIS if remote referrals are not present', function () {
                dataStoreService.getReferrals.and.returnValue(utils.getPromise(q, [undefined]));
                uploadReferralLocationsConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.createReferrals).toHaveBeenCalledWith('opUnit1', localReferralLocations);
            });

            it('should update the remote referral locations if local referrals are latest', function () {
                var remoteReferrals = {
                    "orgUnit": "opUnit1",
                    "clientLastUpdated": "2015-07-16T07:00:00.000Z",
                    "Facility1": {
                        value: "facility one"
                    }
                };
                dataStoreService.getReferrals.and.returnValue(utils.getPromise(q, [remoteReferrals]));
                uploadReferralLocationsConsumer.run(mockMessage);
                scope.$apply();

                expect(dataStoreService.updateReferrals).toHaveBeenCalledWith('opUnit1', localReferralLocations);
            });

            it('should update the local referral locations if remote referrals are latest', function () {
                var remoteReferrals = {
                    "orgUnit": "opUnit1",
                    "clientLastUpdated": "2015-07-18T07:00:00.000Z",
                    "Facility1": {
                        value: "facility one"
                    }
                };
                dataStoreService.getReferrals.and.returnValue(utils.getPromise(q, [remoteReferrals]));
                uploadReferralLocationsConsumer.run(mockMessage);
                scope.$apply();

                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(remoteReferrals);
            });
        });
    });
