define(["referralLocationsController", "angularMocks", "utils", "lodash", "referralLocationsRepository", "moment", "timecop"],
    function(ReferralLocationsController, mocks, utils, _, ReferralLocationsRepository, moment, timecop) {
        describe("referral locations controller", function() {
            var scope,
                referralLocationsController,
                db,
                q,
                referralLocationsRepository,
                hustle,
                moment,
                fakeModal,
                currentTime;

            beforeEach(module("hustle"));
            beforeEach(mocks.inject(function($rootScope, $q, $hustle) {
                scope = $rootScope.$new();
                hustle = $hustle;
                scope.orgUnit = {
                    "id": "some_id",
                    "name": "Some name",
                    "parent": {
                        "id": "some_parent_id"
                    }
                };
                scope.locale = "en";

                scope.resourceBundle = {
                    "uploadReferralLocationsDesc": "upsert referral Locations for op unit",
                };

                currentTime = "2014-10-29T12:34:54.972Z";
                Timecop.install();
                Timecop.freeze(new Date(currentTime));

                fakeModal = {
                    close: function() {
                        this.result.confirmCallBack();
                    },
                    dismiss: function(type) {
                        this.result.cancelCallback(type);
                    },
                    open: function(object) {}
                };

                q = $q;
                referralLocationsRepository = new ReferralLocationsRepository();
                spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
            }));

            afterEach(function() {
                Timecop.returnToPresent();
                Timecop.uninstall();
            });

            it("should load existing referral locations for given op unit", function() {
                var existingReferralLocations = {
                    "orgUnit": scope.orgUnit.id,
                    "MSF Facility 1": {
                        "name": "Some alias",
                        "isDisabled": false
                    }
                };
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, existingReferralLocations));

                referralLocationsController = new ReferralLocationsController(scope, hustle, fakeModal, referralLocationsRepository);
                scope.$apply();

                var expectedReferralLocation = {
                    "genericName": "MSF Facility 1",
                    "aliasName": "Some alias",
                    "hasExistingName": true,
                    "isDisabled": false
                };
                expect(scope.referralLocations[0]).toEqual(expectedReferralLocation);
            });

            it("should initialize referral locations when there are no existing referral locations", function() {
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, undefined));

                referralLocationsController = new ReferralLocationsController(scope, hustle, fakeModal, referralLocationsRepository);
                scope.$apply();

                expect(scope.referralLocations.length).toEqual(9);
                expect(scope.referralLocations[0].aliasName).toEqual("");
            });

            it("should save referral locations with aliases for the op unit", function() {
                spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, undefined));
                scope.$parent.closeNewForm = jasmine.createSpy();
                spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

                referralLocationsController = new ReferralLocationsController(scope, hustle, fakeModal, referralLocationsRepository);
                scope.$apply();

                scope.referralLocations = [{
                    "genericName": "MSF Facility 1",
                    "aliasName": "Some alias",
                    "isDisabled": false,
                    "displayOrder": 0,
                }, {
                    "genericName": "MSF Facility 2",
                    "aliasName": "",
                    "isDisabled": false,
                    "displayOrder": 1
                }, {
                    "genericName": "MSF Facility 3",
                    "aliasName": "Some other alias",
                    "isDisabled": true,
                    "displayOrder": 2
                }];

                var expectedPayload = {
                    "orgUnit": scope.orgUnit.id,
                    "MSF Facility 1": {
                        "name": "Some alias",
                        "isDisabled": false
                    },
                    "MSF Facility 3": {
                        "name": "Some other alias",
                        "isDisabled": true
                    },
                    "clientLastUpdated": currentTime
                };

                scope.save();
                scope.$apply();

                expect(referralLocationsRepository.upsert).toHaveBeenCalledWith(expectedPayload);
                expect(scope.$parent.closeNewForm).toHaveBeenCalledWith(scope.orgUnit, "savedReferralLocations");
                expect(hustle.publish).toHaveBeenCalledWith({
                    "data": scope.orgUnit.id,
                    "type": "uploadReferralLocations",
                    "locale": "en",
                    "desc": "upsert referral Locations for op unit Some name"
                }, "dataValues");
            });
        });
    });
