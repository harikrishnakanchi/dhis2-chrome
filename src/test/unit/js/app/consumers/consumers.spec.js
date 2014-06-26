define(["consumers", "dataValuesConsumer", "orgUnitConsumer", "dispatcher", "consumerRegistry", "datasetConsumer"], function(consumers, dataValuesConsumer, orgUnitConsumer, dispatcher, consumerRegistry, datasetConsumer) {
    describe("consumers", function() {
        var app;
        beforeEach(function() {
            app = {
                "service": jasmine.createSpy()
            };
        });
        it("should register consumers with angular", function() {
            consumers.init(app);
            expect(app.service).toHaveBeenCalledWith("dataValuesConsumer", ["dataService", "dataRepository", "dataSetRepository", "userPreferenceRepository", "$q", "approvalService", dataValuesConsumer]);
            expect(app.service).toHaveBeenCalledWith("orgUnitConsumer", ["orgUnitService", orgUnitConsumer]);
            expect(app.service).toHaveBeenCalledWith("datasetConsumer", ["datasetService", datasetConsumer]);
            expect(app.service).toHaveBeenCalledWith("dispatcher", ["$q", "dataValuesConsumer", "orgUnitConsumer", "datasetConsumer", dispatcher]);
            expect(app.service).toHaveBeenCalledWith("consumerRegistry", ["$hustle", "$q", "dispatcher", consumerRegistry]);
        });
    })
})