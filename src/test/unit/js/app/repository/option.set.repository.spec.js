define(["optionSetRepository", "angularMocks", "utils", "referralLocationsRepository", "excludedLineListOptionsRepository", "optionSetTransformer"],
    function(OptionSetRepository, mocks, utils, ReferralLocationsRepository, ExcludedLineListOptionsRepository, optionSetTransformer) {
    describe("optionSet repository", function() {
        var optionSetRepository, db, mockStore, mockDB, q, scope, referralLocations, excludedLineListOptionsRepository,
            referralLocationsRepository, moduleId;

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

            spyOn(optionSetTransformer, "enrichOptionSets");

            excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository();
            spyOn(excludedLineListOptionsRepository, "get").and.returnValue(utils.getPromise(q, {}));

            optionSetRepository = new OptionSetRepository(mockDB.db, q, referralLocationsRepository, excludedLineListOptionsRepository);
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

        it('should filter the optionSets by code', function () {
            var filteredOptionSet,
                mockOptionSets = [{
                    code: 'someOptionSetCode'
                }, {
                    code: 'someOtherOptionSetCode'
                }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, mockOptionSets));

            optionSetRepository.getOptionSetByCode('someOptionSetCode').then(function (data) {
                filteredOptionSet = data;
            });

            scope.$apply();
            expect(filteredOptionSet).toEqual(mockOptionSets[0]);
        });

        describe('getOptionSets', function () {
            beforeEach(function () {
                moduleId = "someModuleId";
            });

            it('should get all optionSets', function () {
                optionSetRepository.getOptionSets(moduleId);
                scope.$apply();

                expect(mockStore.getAll).toHaveBeenCalled();
            });

            it('should get referral locations', function () {
                optionSetRepository.getOptionSets(moduleId);
                scope.$apply();

                expect(referralLocationsRepository.get).toHaveBeenCalledWith(moduleId);
            });

            it('should get excluded linelist options', function () {
                optionSetRepository.getOptionSets(moduleId);
                scope.$apply();

                expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith(moduleId);
            });

            it('should enrich optionSets', function () {
                optionSetRepository.getOptionSets(moduleId);
                scope.$apply();

                expect(optionSetTransformer.enrichOptionSets).toHaveBeenCalled();
            });
        });
    });
});
