define(['metadataHelper', 'angularMocks', 'utils', 'changeLogRepository'], function (MetadataHelper, mocks, utils, ChangeLogRepository) {
    describe('MetadataHelper', function () {
        var metadataHelper, changeLogRepository, q, scope;
        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, ""));
            metadataHelper = new MetadataHelper(q, changeLogRepository);
        }));

        it('should check metadata changeLog', function () {
            metadataHelper.checkMetadata();
            scope.$apply();

            expect(changeLogRepository.get).toHaveBeenCalledWith('metaData');
        });

        it('should reject the promise if metadata changeLog is not present', function (done) {
            changeLogRepository.get.and.returnValue(utils.getPromise(q, undefined));
            metadataHelper.checkMetadata().then(done.fail, function (message) {
                expect(message).toEqual('noMetadata');
                done();
            });
            scope.$apply();
        });
    });
});