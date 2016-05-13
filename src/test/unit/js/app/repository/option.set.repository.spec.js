define(["optionSetRepository", "angularMocks", "utils", "referralLocationsRepository"], function(OptionSetRepository, mocks, utils, ReferralLocationsRepository) {
    describe("optionSet repository", function() {
        var optionSetRepository, db, mockStore, q, scope, referralLocations;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            referralLocations = {
                "id": "some id",
                "clientLastUpdated": "some time",
                "MSF Facility 1": {
                    "name": "Referral 1",
                    "isDisabled": false
                }
            };

            referralLocationsRepository = new ReferralLocationsRepository();
            spyOn(referralLocationsRepository, "get").and.returnValue(utils.getPromise(q, referralLocations));

            optionSetRepository = new OptionSetRepository(mockDB.db, referralLocationsRepository);
        }));

        it("should get all option sets", function() {
            var allOptionSets = [{
                "id": 123
            }];
            mockStore.getAll.and.returnValue(utils.getPromise(q, allOptionSets));

            var result;
            optionSetRepository.getAll().then(function(optionSets) {
                result = optionSets;
            });
            scope.$apply();

            expect(mockStore.getAll).toHaveBeenCalled();
            expect(result).toEqual(allOptionSets);
        });

        it("should get option set mapping", function() {
            var allOptionSets = [{
                'id': 'os1',
                'options': [{
                    'id': 'os1o1',
                    'name': 'os1o1 name'
                }]
            }, {
                'id': 'os2',
                'options': [{
                    'id': 'os2o1',
                    'name': 'os2o1 name'
                }]
            }, {
                'id': 'os3',
                'code': '_referralLocations',
                'options': [{
                    'id': 'os3o1',
                    'name': 'MSF Facility 1'
                }]
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, allOptionSets));


            var optionSetMap, optionMap;

            optionSetRepository.getOptionSetMapping().then(function(data) {
                optionSetMap = data.optionSetMap;
                optionMap = data.optionMap;
            });
            scope.$apply();

            expect(optionSetMap).toEqual({
                "os1": [{
                    "id": 'os1o1',
                    "name": 'os1o1 name'
                }],
                "os2": [{
                    "id": 'os2o1',
                    "name": 'os2o1 name'
                }],
                "os3": [{
                    "id": 'os3o1',
                    "name": 'Referral 1',
                    "displayName": 'Referral 1',
                    "isDisabled": false
                }]
            });
            expect(optionMap).toEqual({
                "os1o1": "os1o1 name",
                "os2o1": "os2o1 name",
                "os3o1": "Referral 1"
            });


        });
    });
});
