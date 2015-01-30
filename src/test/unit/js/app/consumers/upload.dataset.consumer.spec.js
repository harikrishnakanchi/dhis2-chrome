define(["uploadDatasetConsumer"], function(UploadDatasetConsumer) {
    describe("uploadDatasetConsumer", function() {
        var uploadDatasetConsumer, message, payload, orgunitService;

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

            uploadDatasetConsumer = new UploadDatasetConsumer(orgunitService);

            message = {
                data: {
                    data: payload,
                    type: "associateDataset"
                }
            };

        });

        it("should create org unit", function() {
            uploadDatasetConsumer.run(message);
            expect(orgunitService.associateDataSetsToOrgUnit).toHaveBeenCalledWith(payload);
        });

    });
});
