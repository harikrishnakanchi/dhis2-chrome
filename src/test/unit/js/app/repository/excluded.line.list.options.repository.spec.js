define(['angularMocks', 'utils', 'excludedLineListOptionsRepository'], function (mocks, utils, ExcludedLineListOptionsRepository) {
    describe('ExcludedLineListOptionsRepository', function () {

        var excludedLineListOptionsRepository, q, mockDB, mockStore, db;
        beforeEach(mocks.inject(function ($q) {
            q = $q;
            mockDB = utils.getMockDB(q);
            db = mockDB.db;
            mockStore = mockDB.objectStore;
            excludedLineListOptionsRepository = new ExcludedLineListOptionsRepository(db);
        }));

        it('should get all the excluded line list options for a module', function () {
            var moduleId = 'someModuleId';
            excludedLineListOptionsRepository.get(moduleId);
            expect(mockStore.find).toHaveBeenCalledWith(moduleId);
        });

        it('should upsert the excluded linelist options for a module', function () {
            var payload = 'someData';
            excludedLineListOptionsRepository.upsert(payload);
            expect(mockStore.upsert).toHaveBeenCalledWith(payload);
        });
    });
});