define(["orgUnitGroupConsumer"], function(OrgUnitGroupConsumer) {
    describe("orgUnitGroupConsumer", function() {
        var orgUnitGroupConsumer, message, payload, orgUnitGroupService;

        beforeEach(function() {
            payload = [{
                "id": "a35778ed565",
                "name": "Most-at-risk Population",
                "organisationUnits": [{
                    "id": "a119bd25ace",
                    "name": "Out-patient General"
                }, {
                    "id": "a0c51512f88",
                    "name": "OBGYN"
                }, {
                    "id": "a43bd484a05",
                    "name": "Laboratory"
                }],
                "shortName": "Most-at-risk Population"
            }];
            orgUnitGroupService = jasmine.createSpyObj({}, ['upsert']);

            orgUnitGroupConsumer = new OrgUnitGroupConsumer(orgUnitGroupService);
            message = {
                data: {
                    data: payload,
                    type: "upsertOrgUnitGroups"
                }
            };

        });

        it("should create org unit groups", function() {
            orgUnitGroupConsumer.run(message);
            expect(orgUnitGroupService.upsert).toHaveBeenCalledWith(payload);
        });

    });
});