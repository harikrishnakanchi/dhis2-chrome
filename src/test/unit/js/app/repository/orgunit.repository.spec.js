define(["orgUnitRepository", "utils", "angularMocks"], function(OrgUnitRepository, utils, mocks) {
    describe("Org Unit Repository specs", function() {
        var mockOrgStore, mockDb, orgUnitRepository, q, orgUnits, scope;
        var getAttr = function(key, value) {
            return {
                "attribute": {
                    "code": key
                },
                "value": value
            };
        };

        beforeEach(mocks.inject(function($q, $rootScope) {
            q = $q;
            orgUnits = [{
                "a": "b"
            }, {
                "c": "d"
            }];
            scope = $rootScope.$new();
            mockDb = utils.getMockDB(q, {}, orgUnits);
            mockOrgStore = mockDb.objectStore;
            orgUnitRepository = new OrgUnitRepository(mockDb.db);
        }));

        it("should save org hierarchy", function() {
            var orgUnit = [{
                "id": "org_0",
                "level": 1
            }];

            orgUnitRepository.upsert(orgUnit).then(function(data) {
                expect(data).toEqual(orgUnit);
            });
            expect(mockOrgStore.upsert).toHaveBeenCalledWith(orgUnit);
        });

        it("should get all org units", function() {
            orgUnitRepository.getAll("someOrgUnit").then(function(results) {
                expect(results).toEqual(orgUnits);
            });
            expect(mockOrgStore.getAll).toHaveBeenCalled();
        });

        it("should get all projects", function() {
            var project = {
                "id": "prj",
                "attributeValues": [getAttr("projCode", "123"), getAttr("Type", "Project")]
            };
            var country = {
                "id": "con",
                "attributeValues": [getAttr("projCode", "421"), getAttr("Type", "Country")]
            };
            orgUnits = [project, country];
            mockDb = utils.getMockDB(q, {}, orgUnits);
            mockOrgStore = mockDb.objectStore;
            orgUnitRepository = new OrgUnitRepository(mockDb.db);

            orgUnitRepository.getAllProjects().then(function(data) {
                expect(data.length).toEqual(1);
                expect(data[0]).toEqual(project);
                expect(project.code).toEqual("123");
            });

            scope.$apply();
        });
    });
});