define(["dispatcher", "angularMocks", "utils"], function(Dispatcher, mocks, utils) {
    describe("dispatcher", function() {
        var uploadCompletionDataConsumer, uploadDataConsumer, downloadDataConsumer, uploadApprovalDataConsumer, dispatcher, message, q, scope, systemSettingConsumer, createUserConsumer, updateUserConsumer;

        beforeEach(mocks.inject(function($q, $rootScope) {
            uploadApprovalDataConsumer = {
                'run': jasmine.createSpy("uploadApprovalDataConsumer")
            };
            uploadCompletionDataConsumer = {
                'run': jasmine.createSpy("uploadCompletionDataConsumer")
            };
            uploadDataConsumer = {
                'run': jasmine.createSpy("uploadDataConsumer")
            };
            downloadDataConsumer = {
                'run': jasmine.createSpy("downloadDataConsumer")
            };
            orgUnitConsumer = {
                'run': jasmine.createSpy("orgUnitConsumer")
            };
            datasetConsumer = {
                'run': jasmine.createSpy("datasetConsumer")
            };
            systemSettingConsumer = {
                'run': jasmine.createSpy("systemSettingConsumer")
            };
            createUserConsumer = {
                'run': jasmine.createSpy("createUserConsumer")
            };
            updateUserConsumer = {
                'run': jasmine.createSpy("updateUserConsumer")
            };
            message = {};
            q = $q;
            scope = $rootScope.$new();
            downloadDataConsumer.run.and.returnValue(utils.getPromise(q, {}));
            dispatcher = new Dispatcher(q, orgUnitConsumer, datasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer, downloadDataConsumer, uploadDataConsumer, uploadCompletionDataConsumer, uploadApprovalDataConsumer);
        }));

        it("should call upload data consumer for uploading data values", function() {
            message.data = {
                "data": {},
                "type": "uploadDataValues"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(downloadDataConsumer.run).toHaveBeenCalledWith(message);
            expect(uploadDataConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call download data consumer for downloading data values as a fire-and-forget", function() {
            message.data = {
                "data": {},
                "type": "downloadData"
            };

            var returnValue = dispatcher.run(message);

            expect(downloadDataConsumer.run).toHaveBeenCalledWith(message);
            expect(returnValue).toBeUndefined();
        });

        it("should call completion data consumer for uploading completion data", function() {
            message.data = {
                "data": {},
                "type": "uploadCompletionData"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(downloadDataConsumer.run).toHaveBeenCalledWith(message);
            expect(uploadCompletionDataConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call approval data consumer for uploading approval data", function() {
            message.data = {
                "data": {},
                "type": "uploadApprovalData"
            };

            dispatcher.run(message);
            scope.$apply();

            expect(downloadDataConsumer.run).toHaveBeenCalledWith(message);
            expect(uploadApprovalDataConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call org units consumer", function() {
            message.data = {
                "data": {},
                "type": "upsertOrgUnit"
            };
            dispatcher.run(message);
            expect(orgUnitConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call dataset consumer", function() {
            message.data = {
                "data": {},
                "type": "associateDataset"
            };
            dispatcher.run(message);
            expect(datasetConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call system setting consumer", function() {
            message.data = {
                "data": {},
                "type": "excludeDataElements"
            };
            dispatcher.run(message);
            expect(systemSettingConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should fail if no hanlder found of payload type", function() {
            message.data = {
                "data": {},
                "type": "foo"
            };
            dispatcher.run(message).then(function() {
                expect(true).toBe(false);
            }, function() {
                expect(true).toBe(true);
            });
            scope.$apply();
        });


        it("should call create user consumer", function() {
            message.data = {
                "data": {},
                "type": "createUser"
            };
            dispatcher.run(message);
            expect(createUserConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call update user consumer", function() {
            message.data = {
                "data": {},
                "type": "updateUser"
            };
            dispatcher.run(message);
            expect(updateUserConsumer.run).toHaveBeenCalledWith(message);
        });
    });
});