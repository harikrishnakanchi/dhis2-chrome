define(["dispatcher", "angularMocks"], function(Dispatcher, mocks) {
    describe("dispatcher", function() {
        var dataValuesConsumer, dispatcher, message, q, scope;

        beforeEach(mocks.inject(function($q, $rootScope) {
            dataValuesConsumer = jasmine.createSpyObj({}, ['run']);
            orgUnitConsumer = jasmine.createSpyObj({}, ['run']);
            message = {};
            q = $q;
            scope = $rootScope.$new();
            dispatcher = new Dispatcher(q, dataValuesConsumer, orgUnitConsumer);
        }));

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

    });
});