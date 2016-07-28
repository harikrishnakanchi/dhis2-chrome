define(["referralLocationsRepository", "datasetRepository", "angularMocks", "utils"], function(ReferralLocationsRepository, DatasetRepository, mocks, utils) {
    describe("referralLocationsRepository", function() {
        var datasetRepository, repo, mockStore, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            var mockDB = utils.getMockDB($q);
            mockStore = mockDB.objectStore;

            datasetRepository = new DatasetRepository();
            repo = new ReferralLocationsRepository(mockDB.db, $q, datasetRepository);
        }));

        describe("get", function() {
            it("should return empty array when opUnitId is not given", function() {
                repo.get("").then(function(data) {
                    expect(data).toEqual([]);
                });
                scope.$apply();
                expect(mockStore.find).not.toHaveBeenCalled();
            });

            it('should return referral locations when opUnitId is given', function () {
                mockStore.find.and.returnValue(utils.getPromise(q, {}));
                repo.get('someOpUnitId');

                var expectedReferralLocations = {};
                expect(mockStore.find).toHaveBeenCalled();
            });

        });

        describe('findAll', function () {
           it('should return all referral locations', function () {
               mockStore.each.and.returnValue(utils.getPromise(q, []));
               repo.findAll();
               expect(mockStore.each).toHaveBeenCalled();
           });
        });

        describe("getWithId", function () {

            var opUnitId;
            beforeEach(function () {
                var mockDataSets = [{
                    id: 'someDatasetId',
                    isReferralDataset: true,
                    dataElements: [{ id: 'someId' }, { id: 'someOtherId' }]
                }];
                opUnitId = 'someOpUnitId';
                spyOn(datasetRepository, 'getAll').and.returnValue(utils.getPromise(q, mockDataSets));

                var mockDataElements = [{
                    id: 'someId',
                    formName: 'SomeReferralLocation'
                }, {
                    id: 'someOtherId',
                    formName: 'SomeOtherReferralLocation'
                }];
                var enrichedMockDataSet = [{
                    id: 'someDatasetId',
                    isReferralDataset: true,
                    sections: [{
                        dataElements: mockDataElements
                    }]
                }];
                spyOn(datasetRepository, 'includeDataElements').and.returnValue(utils.getPromise(q, enrichedMockDataSet));

                var mockReferralLocations = {
                    orgUnit: opUnitId,
                    clientLastUpdated: 'someTime',
                    'SomeReferralLocation': {
                        name: "SomeName",
                        isDisabled: false
                    },
                    'SomeOtherReferralLocation': {
                        name: "SomeOtherName",
                        isDisabled: true
                    }
                };
                mockStore.find.and.returnValue(utils.getPromise(q, mockReferralLocations));

            });

            it('should return referral locations with id for the given opUnitId', function () {
                var referralLocations;
                repo.getWithId(opUnitId).then(function (data) {
                    referralLocations = data;
                });
                scope.$apply();
                var expectedReferralLocations = {
                    orgUnit: opUnitId,
                    clientLastUpdated: 'someTime',
                    referralLocations: [{
                        id: 'someId',
                        name: 'SomeName',
                        isDisabled: false
                    }, {
                        id: 'someOtherId',
                        name: 'SomeOtherName',
                        isDisabled: true
                    }]
                };
                expect(referralLocations).toEqual(expectedReferralLocations);
            });

            it('should not enrich the referral locations if there is no referral location for the op unit', function () {
                mockStore.find.and.returnValue(utils.getPromise(q, undefined));
                repo.get('someOpUnitId');
                scope.$apply();

                expect(datasetRepository.getAll).not.toHaveBeenCalled();
                expect(datasetRepository.includeDataElements).not.toHaveBeenCalled();
            });

        });
    });
});