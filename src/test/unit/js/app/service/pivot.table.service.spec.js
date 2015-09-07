define(["pivotTableService", "angularMocks", "properties", "utils", "timecop", "moment"], function(PivotTableService, mocks, properties, utils, timecop, moment) {
    describe("pivot table service", function() {
        var http, httpBackend, pivotTableService, q, scope, lastUpdatedAt;

        beforeEach(mocks.inject(function($injector, $q, $rootScope) {
            http = $injector.get("$http");
            q = $q;
            scope = $rootScope;
            httpBackend = $injector.get("$httpBackend");
            thisMoment = moment("2014-01-01T");
            lastUpdatedAt = thisMoment.toISOString();
            Timecop.install();
            Timecop.freeze(thisMoment.toDate());
            pivotTableService = new PivotTableService(http, q);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get chart data when the dimensions are category options", function() {
            var pivotTable = {
                "name": "some table",
                "id": "tab1"
            };
            var pivotTables = {
                "reportTables": [pivotTable]
            };

            httpBackend.expectGET(properties.dhis.url + "/api/reportTables.json?fields=id&filter=name:like:%5BFieldApp&paging=false").respond(200, pivotTables);
            httpBackend.expectGET(properties.dhis.url +
                "/api/reportTables/tab1.json?fields=columns%5Bdimension,filter,items%5Bid,name%5D%5D,rows%5Bdimension,filter,items%5Bid,name%5D%5D,filters%5Bdimension,filter,items%5Bid,name%5D%5D,!lastUpdated,!href,!created,!publicAccess,!rewindRelativePeriods,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren,!externalAccess,!access,!relativePeriods,!columnDimensions,!rowDimensions,!filterDimensions,!user,!organisationUnitGroups,!itemOrganisationUnitGroups,!userGroupAccesses,!indicators,!dataElements,!dataElementOperands,!dataElementGroups,!dataSets,!periods,!organisationUnitLevels,!organisationUnits,!reportParams"
            ).respond(200, pivotTable);
            var actualData;
            pivotTableService.getAllPivotTables().then(function(data) {
                actualData = data;
                expect(data).toEqual([pivotTable]);
            });

            httpBackend.flush();
        });

        it("should get all field app tables for specified datasets", function() {
            var tables = [{
                "name": "[FieldApp - Funky Dataset]",
                "someAttribute": "someValue",
                "id": "tab1"
            }, {
                "name": "[FieldApp  - CoolDataset]",
                "someAttribute": "someValue",
                "id": "tab2"
            }, {
                "name": "[FieldApp - Not needed Dataset]",
                "someAttribute": "someValue",
                "id": "tab3"
            }];

            var datasets = [{
                "id": "ds1",
                "code": "Funky Dataset"
            }, {
                "id": "ds2",
                "code": "CoolDataset"
            }];

            httpBackend.expectGET(properties.dhis.url + "/api/reportTables.json?fields=id&filter=name:like:%5BFieldApp&paging=false").respond(200, {
                "reportTables": tables
            });

            httpBackend.expectGET(properties.dhis.url +
                "/api/reportTables/tab1.json?fields=columns%5Bdimension,filter,items%5Bid,name%5D%5D,rows%5Bdimension,filter,items%5Bid,name%5D%5D,filters%5Bdimension,filter,items%5Bid,name%5D%5D,!lastUpdated,!href,!created,!publicAccess,!rewindRelativePeriods,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren,!externalAccess,!access,!relativePeriods,!columnDimensions,!rowDimensions,!filterDimensions,!user,!organisationUnitGroups,!itemOrganisationUnitGroups,!userGroupAccesses,!indicators,!dataElements,!dataElementOperands,!dataElementGroups,!dataSets,!periods,!organisationUnitLevels,!organisationUnits,!reportParams"
            ).respond(200, tables[0]);

            httpBackend.expectGET(properties.dhis.url +
                "/api/reportTables/tab2.json?fields=columns%5Bdimension,filter,items%5Bid,name%5D%5D,rows%5Bdimension,filter,items%5Bid,name%5D%5D,filters%5Bdimension,filter,items%5Bid,name%5D%5D,!lastUpdated,!href,!created,!publicAccess,!rewindRelativePeriods,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren,!externalAccess,!access,!relativePeriods,!columnDimensions,!rowDimensions,!filterDimensions,!user,!organisationUnitGroups,!itemOrganisationUnitGroups,!userGroupAccesses,!indicators,!dataElements,!dataElementOperands,!dataElementGroups,!dataSets,!periods,!organisationUnitLevels,!organisationUnits,!reportParams"
            ).respond(200, tables[1]);

            httpBackend.expectGET(properties.dhis.url +
                "/api/reportTables/tab3.json?fields=columns%5Bdimension,filter,items%5Bid,name%5D%5D,rows%5Bdimension,filter,items%5Bid,name%5D%5D,filters%5Bdimension,filter,items%5Bid,name%5D%5D,!lastUpdated,!href,!created,!publicAccess,!rewindRelativePeriods,!userOrganisationUnit,!userOrganisationUnitChildren,!userOrganisationUnitGrandChildren,!externalAccess,!access,!relativePeriods,!columnDimensions,!rowDimensions,!filterDimensions,!user,!organisationUnitGroups,!itemOrganisationUnitGroups,!userGroupAccesses,!indicators,!dataElements,!dataElementOperands,!dataElementGroups,!dataSets,!periods,!organisationUnitLevels,!organisationUnits,!reportParams"
            ).respond(200, tables[2]);

            var actualData;

            pivotTableService.getAllTablesForDataset(datasets).then(function(data) {
                actualData = data;
            });

            httpBackend.flush();

            expect(actualData).toEqual([{
                "name": "[FieldApp - Funky Dataset]",
                "dataset": "ds1",
                "id": "tab1",
                "someAttribute": "someValue"
            }, {
                "name": "[FieldApp  - CoolDataset]",
                "dataset": "ds2",
                "id": "tab2",
                "someAttribute": "someValue"
            }]);
        });
        describe("getPivotTableDataForOrgUnit", function() {
            it("should build the correct url for the monthly morbidity chart", function() {
                var tableDefinition = {
                    "id": "fjNyea08Bzt",
                    "name": "Field App - Monthly Morbidity General",
                    "rewindRelativePeriods": false,
                    "aggregationType": "DEFAULT",
                    "regression": false,
                    "colSubTotals": true,
                    "showDimensionLabels": true,
                    "topLimit": 0,
                    "hideEmptyRows": false,
                    "sortOrder": 0,
                    "userOrganisationUnit": false,
                    "fontSize": "normal",
                    "displayDensity": "normal",
                    "userOrganisationUnitChildren": false,
                    "rowSubTotals": true,
                    "rowTotals": true,
                    "cumulative": false,
                    "showHierarchy": false,
                    "parentGraphMap": {
                        "a2cf79e8f13": ""
                    },
                    "userOrganisationUnitGrandChildren": false,
                    "externalAccess": false,
                    "colTotals": true,
                    "digitGroupSeparator": "space",
                    "displayName": "Field App - Monthly Morbidity General",
                    "reportParams": {
                        "paramParentOrganisationUnit": false,
                        "paramReportingPeriod": false,
                        "paramGrandParentOrganisationUnit": false,
                        "paramOrganisationUnit": false
                    },
                    "relativePeriods": {
                        "last12Months": true
                    },
                    "periods": [],
                    "categoryDimensions": [],
                    "organisationUnitGroups": [],
                    "categoryOptionGroups": [],
                    "columns": [{
                        "id": "pe"
                    }],
                    "rowDimensions": ["dx"],
                    "rows": [{
                        "id": "de"
                    }],
                    "userGroupAccesses": [],
                    "filters": [{
                        "id": "ou"
                    }],
                    "filterDimensions": ["ou"],
                    "categoryOptionCombos": [],
                    "dataElements": [{
                        "id": "a6a2ea68294",
                        "name": "Beri-Beri - Chronic Diseases - Out Patient Department - General",
                        "code": "a6a2ea68294"
                    }, {
                        "id": "a2156b74998",
                        "name": "Chronic Diseases (Noncommunicable) - Chronic Diseases - Out Patient Department - General",
                        "code": "a2156b74998"
                    }, {
                        "id": "ad1f573d58c",
                        "name": "Diabetes Mellitus, Type 1 - Chronic Diseases - Out Patient Department - General",
                        "code": "ad1f573d58c"
                    }],
                    "dataElementDimensions": [],
                    "dataElementOperands": [],
                    "dataElementGroups": [],
                    "itemOrganisationUnitGroups": [],
                    "dataSets": [],
                    "indicators": [],
                    "columnDimensions": ["pe"],
                    "attributeDimensions": []
                };
                httpBackend.expectGET(properties.dhis.url + "/api/analytics.json?dimension=dx:a6a2ea68294;a2156b74998;ad1f573d58c&dimension=pe:LAST_12_MONTHS&displayProperty=NAME&filter=ou:orgUnitId&lastUpdatedAt=" + lastUpdatedAt).respond(200, tableDefinition);
                var actualData;
                pivotTableService.getPivotTableDataForOrgUnit(tableDefinition, "orgUnitId").then(function(data) {
                    actualData = data;
                });

                httpBackend.flush();
            });

            it("should generate correct url for consultations opd general data", function() {
                var tableDefinition = {
                    "id": "UMEn33tJ31m",
                    "name": "Field App - Consultations - Out Patient Department - General",
                    "rewindRelativePeriods": false,
                    "aggregationType": "DEFAULT",
                    "regression": false,
                    "colSubTotals": true,
                    "showDimensionLabels": true,
                    "topLimit": 0,
                    "hideEmptyRows": false,
                    "sortOrder": 0,
                    "userOrganisationUnit": false,
                    "fontSize": "normal",
                    "displayDensity": "normal",
                    "userOrganisationUnitChildren": false,
                    "rowSubTotals": true,
                    "rowTotals": true,
                    "cumulative": false,
                    "showHierarchy": false,
                    "parentGraphMap": {
                        "a2cf79e8f13": ""
                    },
                    "userOrganisationUnitGrandChildren": false,
                    "externalAccess": false,
                    "colTotals": true,
                    "digitGroupSeparator": "space",
                    "displayName": "Field App - Consultations - Out Patient Department - General",
                    "reportParams": {
                        "paramParentOrganisationUnit": false,
                        "paramReportingPeriod": false,
                        "paramGrandParentOrganisationUnit": false,
                        "paramOrganisationUnit": false
                    },
                    "relativePeriods": {
                        "last12Months": true
                    },
                    "periods": [],
                    "categoryDimensions": [{
                        "dataElementCategory": {
                            "id": "a1948a9c6f4",
                            "name": "Pediatric Age Group"
                        },
                        "categoryOptions": [{
                            "id": "a0b89770007",
                            "name": "5-14 years"
                        }, {
                            "id": "ab3a614eed1",
                            "name": "1-23 months"
                        }, {
                            "id": "abf819dca06",
                            "name": "24-59 months"
                        }, {
                            "id": "afca0bdf0f1",
                            "name": "<1 month"
                        }]
                    }],
                    "organisationUnitGroups": [],
                    "categoryOptionGroups": [],
                    "columns": [{
                        "id": "pe"
                    }],
                    "organisationUnitLevels": [],
                    "organisationUnits": [{
                        "id": "a2cf79e8f13",
                        "name": "MSF"
                    }],
                    "rowDimensions": ["a1948a9c6f4", "dx"],
                    "rows": [{
                        "id": "a1948a9c6f4"
                    }, {
                        "id": "de"
                    }],
                    "userGroupAccesses": [],
                    "filters": [{
                        "id": "ou"
                    }],
                    "filterDimensions": ["ou"],
                    "categoryOptionCombos": [],
                    "dataElements": [{
                        "id": "a0143e82873",
                        "name": "New Consultations - Consultations - Out Patient Department - General",
                        "code": "a0143e82873"
                    }, {
                        "id": "a9b8943ccce",
                        "name": "Follow-up Consultations - Consultations - Out Patient Department - General",
                        "code": "a9b8943ccce"
                    }],
                    "dataElementDimensions": [],
                    "dataElementOperands": [],
                    "dataElementGroups": [],
                    "itemOrganisationUnitGroups": [],
                    "dataSets": [],
                    "indicators": [],
                    "columnDimensions": ["pe"],
                    "attributeDimensions": []
                };
                httpBackend.expectGET(properties.dhis.url +
                    "/api/analytics.json?dimension=a1948a9c6f4:a0b89770007;ab3a614eed1;abf819dca06;afca0bdf0f1&dimension=dx:a0143e82873;a9b8943ccce&dimension=pe:LAST_12_MONTHS&displayProperty=NAME&filter=ou:orgUnitId&lastUpdatedAt=" + lastUpdatedAt).respond(200,
                    tableDefinition);
                var actualData;
                pivotTableService.getPivotTableDataForOrgUnit(tableDefinition, "orgUnitId").then(function(data) {
                    actualData = data;
                });

                httpBackend.flush();
            });
        });
    });
});
