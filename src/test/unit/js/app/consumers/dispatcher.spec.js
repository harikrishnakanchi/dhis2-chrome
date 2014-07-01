define(["dispatcher", "angularMocks"], function(Dispatcher, mocks) {
    describe("dispatcher", function() {
        var dataValuesConsumer, dispatcher, message, q, scope, systemSettingConsumer, createUserConsumer, updateUserConsumer;

        beforeEach(mocks.inject(function($q, $rootScope) {
            dataValuesConsumer = jasmine.createSpyObj({}, ['run']);
            orgUnitConsumer = jasmine.createSpyObj({}, ['run']);
            datasetConsumer = jasmine.createSpyObj({}, ['run']);
            systemSettingConsumer = jasmine.createSpyObj({}, ['run']);
            createUserConsumer = jasmine.createSpyObj({}, ['run']);
            updateUserConsumer = jasmine.createSpyObj({}, ['run']);
            message = {};
            q = $q;
            scope = $rootScope.$new();
            dispatcher = new Dispatcher(q, dataValuesConsumer, orgUnitConsumer, datasetConsumer, systemSettingConsumer, createUserConsumer, updateUserConsumer);
        }));

        it("should call data values consumer for uploading data values", function() {
            message.data = {
                "data": {},
                "type": "uploadDataValues"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call data values consumer for downloading data values ", function() {
            message.data = {
                "data": {},
                "type": "downloadDataValues"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call data values consumer for downloading approval data", function() {
            message.data = {
                "data": {},
                "type": "downloadApprovalData"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call data values consumer for uploading approval data", function() {
            message.data = {
                "data": {},
                "type": "uploadApprovalData"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalledWith(message);
        });

        it("should call org units consumer", function() {
            message.data = {
                "data": {},
                "type": "createOrgUnit"
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