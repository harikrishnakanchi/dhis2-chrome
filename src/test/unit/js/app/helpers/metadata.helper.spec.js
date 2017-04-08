define(['metadataHelper', 'angularMocks', 'utils', 'changeLogRepository', 'systemSettingRepository'], function (MetadataHelper, mocks, utils, ChangeLogRepository, SystemSettingRepository) {
    describe('MetadataHelper', function () {
        var metadataHelper, changeLogRepository, q, scope, systemSettingRepository;
        beforeEach(mocks.inject(function ($q, $rootScope) {
            q = $q;
            scope = $rootScope.$new();
            changeLogRepository = new ChangeLogRepository();
            spyOn(changeLogRepository, 'get').and.returnValue(utils.getPromise(q, "someTime"));

            systemSettingRepository = new SystemSettingRepository();
            spyOn(systemSettingRepository, 'getProductKeyLevel').and.returnValue("");
            spyOn(systemSettingRepository, 'getAllowedOrgUnits').and.returnValue([]);

            metadataHelper = new MetadataHelper(q, changeLogRepository, systemSettingRepository);
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

        describe('check relevant orgunits changeLog', function () {
            it('should get product key level', function () {
                metadataHelper.checkMetadata();
                scope.$apply();

                expect(systemSettingRepository.getProductKeyLevel).toHaveBeenCalled();
            });

            describe('if product key level is not global', function () {
                beforeEach(function () {
                    systemSettingRepository.getProductKeyLevel.and.returnValue("notGlobal");
                });
                
                it('should get allowed orgUnits', function () {
                    metadataHelper.checkMetadata();
                    scope.$apply();

                    expect(systemSettingRepository.getAllowedOrgUnits).toHaveBeenCalled();
                });

                it('should check changeLog for each orgUnit in allowed orgUnits', function () {
                    systemSettingRepository.getAllowedOrgUnits.and.returnValue([{id: "IDA"}, {id: "IDB"}]);
                    metadataHelper.checkMetadata();
                    scope.$apply();

                    expect(changeLogRepository.get).toHaveBeenCalledWith('organisationUnits:IDA');
                    expect(changeLogRepository.get).toHaveBeenCalledWith('organisationUnits:IDB');
                });

                it('should reject the promise if any one orgUnit does not have changeLog', function (done) {
                    systemSettingRepository.getAllowedOrgUnits.and.returnValue([{id: "IDA"}, {id: "IDB"}]);
                    changeLogRepository.get.and.returnValues(utils.getPromise(q, "someTime"), utils.getPromise(q, "someTime"), utils.getPromise(q, undefined));
                    metadataHelper.checkMetadata().then(done.fail, function (message) {
                        expect(message).toEqual('noMetadata');
                        done();
                    });
                    scope.$apply();
                });
            });

            describe('if product key level is global', function () {
                beforeEach(function () {
                    systemSettingRepository.getProductKeyLevel.and.returnValue("global");
                });
                it('should check changeLog for orgunits', function () {
                    metadataHelper.checkMetadata();
                    scope.$apply();

                    expect(changeLogRepository.get).toHaveBeenCalledWith('organisationUnits');
                });

                it('should reject a promise if changeLog is not present for orgunits', function (done) {
                    changeLogRepository.get.and.returnValues(utils.getPromise(q, "someTime"), utils.getPromise(q, undefined));
                    metadataHelper.checkMetadata().then(done.fail, function (message) {
                        expect(message).toEqual('noMetadata');
                        done();
                    });
                    scope.$apply();
                });
            });
        });
    });
});