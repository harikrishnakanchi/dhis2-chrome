define(["orgUnitConsumer"], function(OrgunitConsumer) {
    describe("orgunitConsumer", function() {
        var orgunitConsumer, message, payload, orgunitService;

        beforeEach(function() {
            payload = [{
                'id': 'a4acf9115a7',
                'name': 'Org1',
                'shortName': 'Org1',
                'level': 4,
                'openingDate': "YYYY-MM-DD",
                "parent": {
                    name: 'Name1',
                    id: 'Id1'
                },
                "attributeValues": [{
                    "attribute": {
                        "code": "prjConDays",
                        "name": "No of Consultation days per week",
                        "id": "VKc7bvogtcP"
                    },
                    "value": "val1"
                }]
            }];
            orgunitService = jasmine.createSpyObj({}, ['upsert']);

            orgunitConsumer = new OrgunitConsumer(orgunitService);
            message = {
                data: {
                    data: payload,
                    type: "upsertOrgUnit"
                }
            };

        });

        it("should create org unit", function() {
            orgunitConsumer.run(message);
            expect(orgunitService.upsert).toHaveBeenCalledWith(payload);
        });

    });
});