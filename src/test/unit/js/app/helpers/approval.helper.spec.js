define(["approvalHelper", "angularMocks", "approvalDataRepository", "orgUnitRepository", "dataSetRepository", "dataRepository", "utils", "moment", "lodash"],
    function(ApprovalHelper, mocks, ApprovalDataRepository, OrgUnitRepository, DataSetRepository, DataRepository, utils, moment, _) {
        describe("approval helper", function() {
            var hustle, approvalDataRepository, orgUnitRepository, dataSetRepository, dataRepository, q, approvalHelper, scope;

            beforeEach(module('hustle'));
            beforeEach(mocks.inject(function($hustle, $q, $rootScope) {
                hustle = $hustle;
                q = $q;
                scope = $rootScope.$new();

                approvalDataRepository = new ApprovalDataRepository();
                spyOn(approvalDataRepository, "saveLevelOneApproval").and.returnValue(utils.getPromise(q, {}));
                spyOn(approvalDataRepository, "saveLevelTwoApproval").and.returnValue(utils.getPromise(q, {}));

                orgUnitRepository = new OrgUnitRepository();
                dataSetRepository = new DataSetRepository();
                dataRepository = new DataRepository();

                spyOn(hustle, "publish");

                var _Date = Date;
                spyOn(window, 'Date').and.returnValue(new _Date("2014-05-30T12:43:54.972Z"));

                approvalHelper = new ApprovalHelper(hustle, q, scope, orgUnitRepository, dataSetRepository, approvalDataRepository, dataRepository);
            }));

            it('should mark data as complete', function() {
                var data = {
                    "dataSets": ['Vacc'],
                    "period": '2014W14',
                    "orgUnit": 'mod2',
                    "storedBy": 'dataentryuser'
                };

                var l1ApprovalData = _.merge(data, {
                    "date": moment().toISOString(),
                    "status": "NEW"
                });

                var hustlePublishData = {
                    "data": l1ApprovalData,
                    "type": "uploadCompletionData"
                };

                approvalHelper.markDataAsComplete(data);

                scope.$apply();

                expect(approvalDataRepository.saveLevelOneApproval).toHaveBeenCalledWith(l1ApprovalData);
                expect(hustle.publish).toHaveBeenCalledWith(hustlePublishData, "dataValues");
            });

            it('should mark data as approved', function() {
                var data = {
                    "dataSets": ['Vacc'],
                    "period": '2014W14',
                    "orgUnit": 'mod2',
                    "storedBy": 'dataentryuser'
                };

                var l2ApprovalData = {
                    "dataSets": ['Vacc'],
                    "period": '2014W14',
                    "orgUnit": 'mod2',
                    "createdByUsername": 'dataentryuser',
                    "createdDate": moment().toISOString(),
                    "isApproved": true,
                    "status": "NEW"
                };

                var hustlePublishData = {
                    "data": l2ApprovalData,
                    "type": "uploadApprovalData"
                };

                approvalHelper.markDataAsApproved(data);

                scope.$apply();

                expect(approvalDataRepository.saveLevelTwoApproval).toHaveBeenCalledWith(l2ApprovalData);
                expect(hustle.publish).toHaveBeenCalledWith(hustlePublishData, "dataValues");
            });
        });
    });