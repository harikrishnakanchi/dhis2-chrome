define(["referralLocationsController", "angularMocks", "utils", "lodash", "referralLocationsRepository"], function(ReferralLocationsController, mocks, utils, _, ReferralLocationsRepository) {
    describe("referral locations controller", function() {
        var scope, referralLocationsController, db, q, referralLocationsRepository, hustle;

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
            scope.currentUser = {
                "locale": "en"
            };
            scope.resourceBundle = {
                "uploadReferralLocationsDesc": "upsert referral Locations for op unit",
            };


            q = $q;
            referralLocationsRepository = new ReferralLocationsRepository();
            spyOn(referralLocationsRepository, "upsert").and.returnValue(utils.getPromise(q, {}));
        }));

        it("should load existing referral locations for given op unit", function() {
            var existingReferralLocations = { "id": scope.orgUnit.id, "MSF Facility 1": "Some alias" };
            spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, existingReferralLocations));

            referralLocationsController = new ReferralLocationsController(scope, hustle, referralLocationsRepository);
            scope.$apply();

            var expectedReferralLocation = {
                "genericName": "MSF Facility 1",
                "aliasName": "Some alias",
                "displayOrder": 0
            };
            expect(scope.referralLocations[0]).toEqual(expectedReferralLocation);
        });

        it("should initialize referral locations when there are no existing referral locations", function() {
            spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, undefined));

            referralLocationsController = new ReferralLocationsController(scope, hustle, referralLocationsRepository);
            scope.$apply();

            expect(scope.referralLocations.length).toEqual(9);
            expect(scope.referralLocations[0].aliasName).toEqual("");
        });

        it("should save referral locations with aliases for the op unit", function() {
            spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, undefined));
            scope.$parent.closeNewForm = jasmine.createSpy();
            spyOn(hustle, "publish").and.returnValue(utils.getPromise(q, {}));

            referralLocationsController = new ReferralLocationsController(scope, hustle, referralLocationsRepository);
            scope.$apply();

            scope.referralLocations = [{
                "genericName": "MSF Facility 1",
                "aliasName": "Some alias",
                "displayOrder": 0
            }, {
                "genericName": "MSF Facility 2",
                "aliasName": "",
                "displayOrder": 1
            }];

            scope.save();
            scope.$apply();

            expect(referralLocationsRepository.upsert).toHaveBeenCalledWith({"id": scope.orgUnit.id ,"MSF Facility 1": "Some alias"});
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
