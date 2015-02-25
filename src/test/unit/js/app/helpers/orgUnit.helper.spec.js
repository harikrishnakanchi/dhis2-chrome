define(["orgUnitHelper", "angularMocks", "utils", "orgUnitRepository"],
    function(OrgUnitHelper, mocks, utils, OrgUnitRepository) {
        describe("orgUnit helper", function() {
            var orgUnitHelper, orgUnitRepository;

            beforeEach(mocks.inject(function($q, $rootScope) {
                q = $q;
                scope = $rootScope.$new();

                orgUnitRepository = new OrgUnitRepository();
            }));

            it('should mark data as complete', function() {
                var project = {
                    "id": "1",
                    "name": "Prj1",
                    "parent": {
                        "id": "countryId"
                    },
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Project"
                    }]
                };

                var opUnit = {
                    "id": "2",
                    "name": "Opunit1",
                    "parent": {
                        "id": "1"
                    },
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Operation Unit"
                    }]
                };

                var module = {
                    "id": "3",
                    "name": "Mod1",
                    "parent": {
                        "id": "1"
                    },
                    "attributeValues": [{
                        "attribute": {
                            "code": "Type"
                        },
                        "value": "Module"
                    }]
                };

                spyOn(orgUnitRepository, 'get').and.callFake(function(id) {
                    if (id === "1")
                        return utils.getPromise(q, project);
                    if (id === "2")
                        return utils.getPromise(q, opUnit);
                    if (id === "3")
                        return utils.getPromise(q, module);
                    return utils.getPromise(q, {});
                });
                orgUnitHelper = new OrgUnitHelper(orgUnitRepository);

                var result;
                orgUnitHelper.getParentProjectId("3").then(function(data) {
                    result = data;
                });
                scope.$apply();

                expect(result).toBe("1");
            });


        });
    });
