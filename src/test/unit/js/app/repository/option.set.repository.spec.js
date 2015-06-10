define(["optionSetRepository", "angularMocks", "utils"], function(OptionSetRepository, mocks, utils) {
    describe("optionSet repository", function() {
        var optionSetRepository, db, mockStore, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            optionSetRepository = new OptionSetRepository(mockDB.db);
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
            }];

            mockStore.getAll.and.returnValue(utils.getPromise(q, allOptionSets));


            var optionSetMap, optionMap;
            var resourceBundle = {
                'os2o1': 'os2o1 translated name'
            };
            optionSetRepository.getOptionSetMapping(resourceBundle).then(function(data) {
                optionSetMap = data.optionSetMap;
                optionMap = data.optionMap;
            });
            scope.$apply();

            expect(optionSetMap).toEqual({
                "os1": [{
                    "id": 'os1o1',
                    "name": 'os1o1 name',
                    "displayName": 'os1o1 name',
                }],
                "os2": [{
                    "id": 'os2o1',
                    "name": 'os2o1 name',
                    "displayName": 'os2o1 translated name'
                }]
            });
            expect(optionMap).toEqual({
                "os1o1": "os1o1 name",
                "os2o1": "os2o1 translated name"
            });


        });
    });
});
