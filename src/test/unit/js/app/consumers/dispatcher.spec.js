define(["dispatcher"], function(Dispatcher) {
    describe("dispatcher", function() {
        var dataValuesConsumer, dispatcher, message;

        beforeEach(function() {
            dataValuesConsumer = jasmine.createSpyObj({}, ['run']);
            orgUnitConsumer = jasmine.createSpyObj({}, ['run']);
            dispatcher = new Dispatcher(dataValuesConsumer, orgUnitConsumer);
            message = {};
        });

        it("should call data values consumer for uploading data values", function() {
            message.data = {
                "data": {},
                "type": "uploadDataValues"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalled();
        });

        it("should call data values consumer for downloading data values ", function() {
            message.data = {
                "data": {},
                "type": "downloadDataValues"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalled();
        });

        it("should call data values consumer for downloading approval data", function() {
            message.data = {
                "data": {},
                "type": "downloadApprovalData"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalled();
        });

        it("should call data values consumer for uploading approval data", function() {
            message.data = {
                "data": {},
                "type": "uploadApprovalData"
            };
            dispatcher.run(message);
            expect(dataValuesConsumer.run).toHaveBeenCalled();
        });

        it("should call org units consumer", function() {
            message.data = {
                "data": {},
                "type": "createOrgUnit"
            };
            dispatcher.run(message);
            expect(orgUnitConsumer.run).toHaveBeenCalled();
        });

    });
});