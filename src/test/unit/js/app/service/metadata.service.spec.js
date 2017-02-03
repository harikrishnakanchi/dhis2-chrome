define(["metadataService", "properties", "angularMocks", "moment", "dhisUrl", "metadataConf"], function(MetadataService, properties, mocks, moment, dhisUrl, metadataConf) {
    describe("Metadata service", function() {
        var httpBackend, http, metadataService;

        beforeEach(inject(function($injector) {
            httpBackend = $injector.get('$httpBackend');
            http = $injector.get('$http');
            metadataService = new MetadataService(http);
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        it("should get all metadata from local file if syncing for the first time", function() {
            var lastWeek = moment().subtract(1, 'weeks').toISOString();

            var metadataInFile = {
                "users": [],
                "created": lastWeek
            };

            httpBackend.expectGET("data/metadata.json").respond(200, metadataInFile);

            var actualMetadata;
            metadataService.loadMetadataFromFile().then(function(data) {
                actualMetadata = data;
            });

            httpBackend.flush();
            expect(actualMetadata).toEqual(metadataInFile);
        });

        it("should return empty metadata if local file does not exist", function() {
            httpBackend.expectGET("data/metadata.json").respond(404);

            var actualMetadata;
            metadataService.loadMetadataFromFile().then(function(data) {
                actualMetadata = data;
            });

            httpBackend.flush();
            expect(actualMetadata).toEqual({
                created: '2014-03-23T09:02:49.870+0000',
                dataSets: [],
                organisationUnitGroups: [],
                organisationUnits: [],
                programs: []
            });
        });

        describe('getMetadataOfType', function () {
            var type = "categories";
            var fields = metadataConf.types[type];

            it('should get the data based on the given type', function () {
                var url = dhisUrl[type] + "?fields=" + fields;
                var categories = 'someData';
                httpBackend.expectGET(encodeURI(url)).respond(200, {"categories": categories});
                metadataService.getMetadataOfType(type).then(function (data) {
                    expect(data).toEqual(categories);
                });
                httpBackend.flush();
            });

            it('should get only lastUpdated data', function () {
                var lastUpdated = "someTime";
                var url = dhisUrl[type] + "?fields=" + fields + "&filter=lastUpdated:ge:" + lastUpdated;
                httpBackend.expectGET(encodeURI(url)).respond(200, {"categories": ""});
                metadataService.getMetadataOfType(type, lastUpdated);
                httpBackend.flush();
            });
        });
    });
});