define(["optionSetRepository", "angularMocks", "utils", "referralLocationsRepository", "excludedLineListOptionsRepository", "optionSetTransformer"],
    function(OptionSetRepository, mocks, utils, ReferralLocationsRepository, ExcludedLineListOptionsRepository, optionSetTransformer) {
    describe("optionSet repository", function() {
        var optionSetRepository, mockStore, mockDB, q, scope, referralLocations, excludedLineListOptionsRepository,
            referralLocationsRepository, moduleId, opUnitId;

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
                id: 123,
                options: [{id: 'op1'}]
            }], allOptions = [{id: 'op1', name: 'someName'}];

            mockStore.getAll.and.returnValues(utils.getPromise(q, allOptionSets), utils.getPromise(q, allOptions));

            var result;
            optionSetRepository.getAll().then(function(optionSets) {
                expect(mockStore.getAll).toHaveBeenCalled();
                expect(optionSets).toEqual([{id: 123, options: [allOptions[0]]}]);
            });
            scope.$apply();
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
                opUnitId = "someOpUnitId";
            });

            it('should get all optionSets', function () {
                optionSetRepository.getOptionSets(opUnitId, moduleId);
                scope.$apply();

                expect(mockStore.getAll).toHaveBeenCalled();
            });

            it('should get referral locations by opUnitId', function () {
                optionSetRepository.getOptionSets(opUnitId, moduleId);
                scope.$apply();

                expect(referralLocationsRepository.get).toHaveBeenCalledWith(opUnitId);
            });

            it('should get excluded linelist options', function () {
                optionSetRepository.getOptionSets(opUnitId, moduleId);
                scope.$apply();

                expect(excludedLineListOptionsRepository.get).toHaveBeenCalledWith(moduleId);
            });

            it('should enrich optionSets', function () {
                optionSetRepository.getOptionSets(opUnitId, moduleId);
                scope.$apply();

                expect(optionSetTransformer.enrichOptionSets).toHaveBeenCalled();
            });
        });
    });
});
