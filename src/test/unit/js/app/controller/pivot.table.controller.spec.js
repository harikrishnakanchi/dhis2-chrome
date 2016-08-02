define(["angularMocks", "utils", "lodash", "moment", "pivotTableController", "timecop", "translationsService", "filesystemService"], function (mocks, utils, lodash, moment, PivotTableController, timecop, TranslationsService, FilesystemService) {
    describe("pivotTableControllerSpec", function () {

        var scope, rootScope, q, pivotTableController, translationsService, filesystemService;

        beforeEach(mocks.inject(function ($rootScope, $q) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            q = $q;

            Timecop.install();
            Timecop.freeze(new Date("2015-10-29T12:43:54.972Z"));

            scope.data = {
                "headers": [{
                    "name": "a1948a9c6f4",
                    "column": "Pediatric Age Group",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "dx",
                    "column": "Data",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["201507", "201508"],
                    "names": {
                        "dx": "Data",
                        "a2cf79e8f13": "MSF",
                        "201507": "July 2015",
                        "201508": "August 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "a67aa742313": "Follow-up Consultations - Consultations - Out Patient Department - Pediatric",
                        "ou": "Organisation unit",
                        "abf819dca06": "24-59 months",
                        "pe": "Period",
                        "ab3a614eed1": "1-23 months"

                    }
                },
                "rows": [
                    ["ab3a614eed1", "a0e7d3973e3", "201508", "215.0"],
                    ["abf819dca06", "a0e7d3973e3", "201508", "201.0"],
                    ["ab3a614eed1", "a67aa742313", "201507", "1772.0"],
                    ["abf819dca06", "a67aa742313", "201507", "6433.0"],
                    ["ab3a614eed1", "a0e7d3973e3", "201507", "1387.0"],
                    ["abf819dca06", "a0e7d3973e3", "201507", "264.0"]
                ],
                "width": 4
            };

            scope.definition = {
                name: "[FieldApp - NewConsultations] Consultations",
                sortOrder: 0,
                sortAscending: false,
                sortDescending: false,
                sortable: false,
                monthlyReport: true,
                categoryDimensions: [{
                    categoryOptions: [{
                        id: "ab3a614eed1",
                        name: "1-23 months"
                    }, {
                        id: "abf819dca06",
                        name: "24-59 months"
                    }]
                }],
                dataElements: [{
                    id: "a0e7d3973e3",
                    name: "New Consultations - Consultations - Out Patient Department - Pediatric"
                }, {
                    id: "a67aa742313",
                    name: "Follow-up Consultations - Consultations - Out Patient Department - Pediatric"
                }],
                rows: [
                    {
                        items: [
                            {
                                id: 'a0e7d3973e3',
                                name: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                                description: 'random description'
                            },
                            {
                                id: 'a67aa742313',
                                name: 'Follow-up Consultations - Consultations - Out Patient Department - Pediatric',
                                description: 'random description'
                            }
                        ]
                    }
                ]
            };

            scope.locale = "en";

            rootScope.resourceBundle = {
                weeksLabel: "weeks",
                July: "July",
                August: "August",
                September: "September"
            };

            translationsService = new TranslationsService();
            spyOn(translationsService, "translate").and.returnValue(scope.definition.categoryDimensions[0].categoryOptions);

            filesystemService = new FilesystemService();
            spyOn(filesystemService, 'promptAndWriteFile').and.returnValue(utils.getPromise(q, {}));

            pivotTableController = new PivotTableController(scope, rootScope, translationsService, filesystemService);
            scope.$apply();
        }));

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        describe("Export as csv", function () {
            it('should prompt the user to download tabular data to CSV with suggested filename', function () {
                scope.exportToCSV();
                expect(filesystemService.promptAndWriteFile).toHaveBeenCalledWith('NewConsultations.Consultations.29-Oct-2015.csv', jasmine.any(Blob), filesystemService.FILE_TYPE_OPTIONS.CSV);
            });

            describe('CSV Contents', function () {
                var csvContent;
                beforeEach(function () {
                    spyOn(window, 'Blob').and.callFake(function (contentArray) {
                        this.value = contentArray.join();
                    });

                    filesystemService.promptAndWriteFile.and.callFake(function (fileName, blob) {
                        csvContent = blob.value;
                    });

                    scope.resourceBundle = {
                        weeksLabel: "weeks",
                        July: "July",
                        August: "August",
                        October: "October",
                        September: "September",
                        dataElement: "Data Element",
                        category: "Category"
                    };

                    scope.exportToCSV();
                });

                it("should get headers if category is present", function () {
                    var expected = '"Data Element","Category","July 2015 (4 weeks)","August 2015 (5 weeks)"';
                    expect(csvContent).toContain(expected);
                });

                it("should get headers if category not present", function () {
                    scope.isCategoryPresent = false;
                    scope.exportToCSV();
                    scope.$apply();
                    var expected = '"Data Element","July 2015 (4 weeks)","August 2015 (5 weeks)"';

                    expect(csvContent).toContain(expected);
                });

                it("should get data for csv file when categories are present", function () {
                    var expectedDataValues =
                        '"New Consultations","1-23 months",1387,215\n' +
                        '"New Consultations","24-59 months",264,201\n' +
                        '"Follow-up Consultations","1-23 months",1772,\n' +
                        '"Follow-up Consultations","24-59 months",6433,';

                    expect(csvContent).toContain(expectedDataValues);
                });

                it("should get data for csv file when categories are not present", function () {
                    scope.data = {
                        "headers": [{
                            "name": "dx"
                        }, {
                            "name": "pe"
                        }, {
                            "name": "value"
                        }],
                        "metaData": {
                            "pe": ["201508", "201509"],
                            "names": {
                                "dx": "Data",
                                "a2cf79e8f13": "MSF",
                                "201508": "August 2015",
                                "201509": "September 2015",
                                "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                                "pe": "Period"
                            }
                        },
                        "rows": [
                            ["a0e7d3973e3", "201508", "215.0"],
                            ["a0e7d3973e3", "201509", "45.0"]
                        ],
                        "width": 3
                    };

                    scope.definition = {
                        "name": "[FieldApp - NewConsultations] Consultations",
                        "dataElements": [{
                            "id": "a0e7d3973e3",
                            "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                        }],
                        rows: [{
                            items: [
                                {
                                    id: 'a0e7d3973e3',
                                    name: 'New Consultations - Consultations - Out Patient Department - Pediatric'
                                }
                            ]
                        }]
                    };
                    pivotTableController = new PivotTableController(scope, rootScope, translationsService, filesystemService);
                    scope.exportToCSV();
                    scope.$apply();
                    var expectedDataValues = '"New Consultations",215,45';

                    expect(csvContent).toContain(expectedDataValues);
                });
            });
        });

        it("should populate viewmap and other scope variables on load when categories are present", function() {
            var expectedViewMap = [{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementDescription: 'random description',
                dataElementIndex: 1,
                sortKey_201507: 1651,
                sortKey_201508: 416
            }, {
                dataElement: 'a67aa742313',
                dataElementName: 'Follow-up Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementDescription: 'random description',
                dataElementIndex: 2,
                sortKey_201507: 8205,
                sortKey_201508: 0
            }];

            var expectedHeaders = [{
                showHeader: true,
                headers: [{
                    period: '201507',
                    name: 'July 2015',
                    sortKey: 'sortKey_201507',
                    numberOfISOWeeks: 4
                }, {
                    period: '201508',
                    name: 'August 2015',
                    sortKey: 'sortKey_201508',
                    numberOfISOWeeks: 5
                }]
            }, {
                showHeader: true,
                headers: [{
                    period: '201507',
                    name: '1-23 months',
                    category: 'ab3a614eed1',
                    sortKey: 'sortKey_201507'
                }, {
                    period: '201507',
                    name: '24-59 months',
                    category: 'abf819dca06',
                    sortKey: 'sortKey_201507'
                }, {
                    period: '201508',
                    name: '1-23 months',
                    category: 'ab3a614eed1',
                    sortKey: 'sortKey_201508'
                }, {
                    period: '201508',
                    name: '24-59 months',
                    category: 'abf819dca06',
                    sortKey: 'sortKey_201508'
                }]
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(true);
            expect(scope.hasOnlyOneCategory).toEqual(false);
            expect(scope.headersForTable).toEqual(expectedHeaders);
        });

        it("should get data element name", function() {
            var dataElementName = "FieldApp - test";
            var actualdataelementName = scope.getDataElementName(dataElementName);

            expect("FieldApp").toEqual(actualdataelementName);
        });

        it("should populate viewmap and other scope variables on load when categories are not present", function() {
            scope.data = {
                "headers": [{
                    "name": "dx",
                    "column": "Data",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["201508", "201509"],
                    "names": {
                        "dx": "Data",
                        "a2cf79e8f13": "MSF",
                        "201508": "August 2015",
                        "201509": "September 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "pe": "Period"
                    }
                },
                "rows": [
                    ["a0e7d3973e3", "201508", "215.0"],
                    ["a0e7d3973e3", "201509", "45.0"]
                ],
                "width": 3
            };

            scope.definition = {
                "name": "[FieldApp - NewConsultations] Consultations",
                "dataElements": [{
                    "id": "a0e7d3973e3",
                    "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                }],
                rows: [{
                    items: [
                        {
                            id: 'a0e7d3973e3',
                            name: 'New Consultations - Consultations - Out Patient Department - Pediatric'
                        }
                    ]
                }]
            };

            pivotTableController = new PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            var expectedViewMap = [{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementDescription: '',
                dataElementIndex: 1,
                sortKey_201508: 215,
                sortKey_201509: 45
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(false);
        });

        it("should populate viewmap and other scope variables on load when only one category is present", function() {
            scope.data = {
                "headers": [{
                    "name": "dx",
                    "column": "Data",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "pe",
                    "column": "Period",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "a1948a9c6f4",
                    "column": "Surveillance",
                    "type": "java.lang.String",
                    "hidden": false,
                    "meta": true
                }, {
                    "name": "value",
                    "column": "Value",
                    "type": "java.lang.Double",
                    "hidden": false,
                    "meta": false
                }],
                "metaData": {
                    "pe": ["201508"],
                    "names": {
                        "dx": "Data",
                        "a2cf79e8f13": "MSF",
                        "201508": "August 2015",
                        "a0e7d3973e3": "New Consultations - Consultations - Out Patient Department - Pediatric",
                        "ou": "Organisation unit",
                        "pe": "Period",
                        "ab3a614eed1": "Cases"

                    }
                },
                "rows": [
                    ["a0e7d3973e3", "201508", "ab3a614eed1", "25.0"]
                ],
                "width": 4
            };

            scope.definition = {
                "name": "[FieldApp - NewConsultations] Consultations",
                "categoryDimensions": [{
                    "categoryOptions": [{
                        "id": "ab3a614eed1",
                        "name": "Cases"
                    }]
                }],
                "dataElements": [{
                    "id": "a0e7d3973e3",
                    "name": "New Consultations - Consultations - Out Patient Department - Pediatric"
                }],
                rows: [{
                    items: [
                        {
                            id: 'a0e7d3973e3',
                            name: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                            description: 'random description'
                        }
                    ]
                }]
            };

            translationsService.translate.and.returnValue(scope.definition.categoryDimensions[0].categoryOptions);
            pivotTableController = new PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            var expectedViewMap = [{
                dataElement: 'a0e7d3973e3',
                dataElementName: 'New Consultations - Consultations - Out Patient Department - Pediatric',
                dataElementDescription: 'random description',
                dataElementIndex: 1,
                sortKey_201508: 25
            }];

            expect(scope.viewMap).toEqual(expectedViewMap);
            expect(scope.isCategoryPresent).toEqual(true);
            expect(scope.hasOnlyOneCategory).toEqual(true);
        });

        it("should set selectedSortKey", function () {
            scope.definition.sortAscending = false;
            scope.definition.sortDescending = true;
            scope.definition.sortable = true;

            pivotTableController = new PivotTableController(scope, rootScope, translationsService);

            scope.sortByColumn({sortKey: 'sortKey_2015W02'});
            expect(scope.selectedSortKey).toEqual('sortKey_2015W02');

            scope.sortByColumn({sortKey: 'sortKey_2015W03'});
            expect(scope.selectedSortKey).toEqual('sortKey_2015W03');

            scope.sortByColumn({sortKey: 'dataElementIndex'});
            expect(scope.selectedSortKey).toEqual('dataElementIndex');

            scope.sortByColumn({sortKey: 'sortKey_2015W04'});
            expect(scope.selectedSortKey).toEqual('sortKey_2015W04');

            scope.sortByColumn();
            expect(scope.selectedSortKey).toEqual('dataElementIndex');
        });

        it("should not display the download button if download is disabled", function() {
            scope.disableDownload = 'true';
            pivotTableController = new PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            expect(scope.showDownloadButton).toEqual(false);
        });

        it("should display the download button if download is not disabled", function() {
            scope.disableDownload = undefined;
            pivotTableController = new PivotTableController(scope, rootScope, translationsService);
            scope.$apply();

            expect(scope.showDownloadButton).toEqual(true);
        });
    });
});
