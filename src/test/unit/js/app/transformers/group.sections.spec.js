define(["groupSections", "testData"], function(groupSections, testData) {
    describe("group sections", function() {
        var data, groupedSections;

        beforeEach(function() {
            data = [testData["dataSets"],
                testData["sections"],
                testData['dataElements'],
                testData['categoryCombos'],
                testData["categories"],
                testData['categoryOptionCombos'],
                testData['systemSettings']
            ];
            groupedSections = groupSections.enrichGroupedSections(data);
        });

        it("should group sections based on datasets", function() {
            var dataSetKeys = _.keys(groupedSections);
            expect(dataSetKeys.length).toBe(2);
            expect(dataSetKeys).toContain("DS_OPD");
            expect(dataSetKeys).toContain("Vacc");

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
                ["Resident", "Migrant"],
                ["LessThan5", "GreaterThan5", "LessThan5", "GreaterThan5", ]
            ]);

            expect(section1.categoryOptionComboIds).toEqual([1, 2, 3, 4]);
            var section2 = groupedSections.Vacc[0];
            expect(section2.headers).toEqual([
                ["LessThan5", "GreaterThan5"]
            ]);
            expect(section2.categoryOptionComboIds).toEqual([6, 5]);
        });

    });
});