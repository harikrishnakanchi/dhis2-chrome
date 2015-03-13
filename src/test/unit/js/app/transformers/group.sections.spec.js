define(["groupSections", "testData"], function(groupSections, testData) {
    describe("group sections", function() {
        var data, groupedSections;

        beforeEach(function() {
            data = [testData.get("dataSets"),
                testData.get("sections"),
                testData.get('dataElements'),
                testData.get('categoryCombos'),
                testData.get("categories"),
                testData.get('categoryOptionCombos'),
                testData.get('systemSettings'),
                testData.get('organisationUnits')
            ];
            groupedSections = groupSections.enrichGroupedSections(data);
        });

        it("should group sections based on datasets", function() {
            var dataSetKeys = _.keys(groupedSections);
            expect(dataSetKeys.length).toBe(3);
            expect(dataSetKeys).toContain("DS_OPD");
            expect(dataSetKeys).toContain("Vacc");
            expect(groupedSections.DS_OPD[0].orgUnitIds).toEqual(["mod1"]);
            expect(groupedSections.DS_OPD[1].orgUnitIds).toEqual(["mod1"]);
            expect(groupedSections.Vacc[0].orgUnitIds).toEqual(["mod2"]);
            expect(groupedSections.DS_OPD.length).toBe(2);
            expect(groupedSections.Vacc.length).toBe(1);
        });

        it("should get dataelements associated with sections", function() {
            var opdSections = groupedSections.DS_OPD;
            var dataElements = opdSections[0].dataElements;

            expect(dataElements.length).toBe(3);
            expect(dataElements[0].id).toContain("DE1");
            expect(dataElements[1].id).toContain("DE2");
            expect(dataElements[1].name).toContain("DE2 - ITFC");
            expect(dataElements[1].formName).toContain("DE2");

            dataElements = opdSections[1].dataElements;
            expect(dataElements.length).toBe(1);
            expect(dataElements[0].id).toContain("DE1");
            expect(dataElements[0].name).toContain("DE1 - ITFC");
            expect(dataElements[0].formName).toContain("DE1");
        });

        it("should enrich dataelements with categories", function() {

            var opdSections = groupedSections.DS_OPD;
            var dataElements = opdSections[0].dataElements;
            var categories = dataElements[0].categories;

            expect(categories.length).toBe(2);
        });

        it("should set headers and categoryOptionComboIds on sections", function() {
            var section1 = groupedSections.DS_OPD[0];
            expect(section1.headers).toEqual([
                [{
                    "id": 'CO1',
                    "name": 'Resident'
                }, {
                    "id": 'CO2',
                    "name": 'Migrant'
                }],
                [{
                    "id": 'CO3',
                    "name": 'LessThan5'
                }, {
                    "id": 'CO4',
                    "name": 'GreaterThan5'
                }, {
                    "id": 'CO3',
                    "name": 'LessThan5'
                }, {
                    "id": 'CO4',
                    "name": 'GreaterThan5'
                }]
            ]);

            expect(section1.categoryOptionComboIds).toEqual(["1", "2", "3", "4"]);
            var section2 = groupedSections.Vacc[0];
            expect(section2.headers).toEqual([
                [{
                    "id": 'CO3',
                    "name": 'LessThan5'
                }, {
                    "id": 'CO4',
                    "name": 'GreaterThan5'
                }]
            ]);
            expect(section2.categoryOptionComboIds).toEqual(["6", "5"]);
        });

    });
});
