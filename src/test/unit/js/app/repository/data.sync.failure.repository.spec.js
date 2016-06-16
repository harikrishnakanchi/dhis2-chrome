define(['dataSyncFailureRepository', 'angularMocks', 'utils'], function (DataSyncFailureRepository, mocks, utils) {
    describe('Data Sync Failure Repository', function () {

        var q, mockDB, db, rootScope, mockStore, dataSyncFailureRepository, getAllData;

        beforeEach(mocks.inject(function ($injector, $rootScope) {
            q = $injector.get('$q');
            rootScope = $rootScope;

            getAllData = [{
                moduleId: "module1",
                period: "period1"
            }, {
                moduleId: "module2",
                period: "period2"
            }];
            mockDB = utils.getMockDB(q, undefined, getAllData);
            db = mockDB.db;
            mockStore = mockDB.objectStore;

            dataSyncFailureRepository = new DataSyncFailureRepository(db);
        }));

        it('should add module to the store', function () {
            var moduleId = "moduleId";
            var period = "period";

            dataSyncFailureRepository.add(moduleId, period);

            expect(db.objectStore).toHaveBeenCalledWith("dataSyncFailure");
            var expectedUpsert = {
                moduleId: moduleId,
                period: period
            };
            expect(mockStore.upsert).toHaveBeenCalledWith(expectedUpsert);
        });

        it('should remove module from the store', function () {
            var moduleId = "moduleId";
            var period = "period";

            dataSyncFailureRepository.delete(moduleId, period);

            expect(db.objectStore).toHaveBeenCalledWith("dataSyncFailure");

            var expectedParameters = [moduleId, period];
            expect(mockStore.delete).toHaveBeenCalledWith(expectedParameters);
        });

        it('should get all the modules from store', function () {
            dataSyncFailureRepository.getAll().then(function (modules) {
                var expectedData = getAllData;
                expect(modules).toEqual(expectedData);
            });
            rootScope.$apply();
            expect(db.objectStore).toHaveBeenCalledWith("dataSyncFailure");
            expect(mockStore.getAll).toHaveBeenCalled();

        });

    });
});