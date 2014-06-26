define(["datasetConsumer"], function(DatasetConsumer) {
    describe("datasetConsumer", function() {
        var datasetConsumer, message, payload, orgunitService;

        beforeEach(function() {
            payload = {
                dataSets: [{
                    "id": "DS_Physio",
                    "organisationUnits": [{
                        "name": "Mod1",
                        "id": "hvybNW8qEov"
                    }]
                }]
            };

            orgunitService = jasmine.createSpyObj({}, ['associateDataSetsToOrgUnit']);

            datasetConsumer = new DatasetConsumer(orgunitService);

            message = {
                data: {
                    data: payload,
                    type: "associateDataset"
                }
            };

        });

        it("should create org unit", function() {
            datasetConsumer.run(message);
            expect(orgunitService.associateDataSetsToOrgUnit).toHaveBeenCalledWith(payload);
        });

    });
});