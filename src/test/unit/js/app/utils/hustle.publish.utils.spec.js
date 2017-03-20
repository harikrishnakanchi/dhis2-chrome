define(['angularMocks', 'utils', 'hustlePublishUtils'], function (mocks, utils, hustlePublishUtils) {
    describe('publish project data util', function () {
        var hustle, q, rootScope, locale;

        var getHustlePayload = function (type) {
            return {
                type: type,
                data: [],
                locale: locale
            };
        };
        beforeEach(module('hustle'));
        beforeEach(mocks.inject(function ($hustle, $q, $rootScope) {
            hustle = $hustle;
            q = $q;
            rootScope = $rootScope;

            spyOn(hustle, 'publishOnce').and.returnValue(utils.getPromise(q, undefined));
            locale = 'fr';
        }));

        it('should publish downloadModuleDataForProject', function () {
            hustlePublishUtils.publishDownloadProjectData(hustle, locale).then(function () {
                expect(hustle.publishOnce).toHaveBeenCalledWith(getHustlePayload('downloadModuleDataForProject'), 'dataValues');
            });
            rootScope.$apply();
        });

        it('should publish downloadReportDefinitions', function () {
            hustlePublishUtils.publishDownloadProjectData(hustle, locale).then(function () {
                expect(hustle.publishOnce).toHaveBeenCalledWith(getHustlePayload('downloadReportDefinitions'), 'dataValues');
            });
            rootScope.$apply();
        });

        it('should publish downloadReportData', function () {
            hustlePublishUtils.publishDownloadProjectData(hustle, locale).then(function () {
                expect(hustle.publishOnce).toHaveBeenCalledWith(getHustlePayload('downloadReportData'), 'dataValues');
            });
            rootScope.$apply();
        });

        it('should publish downloadHistoricalData', function () {
            hustlePublishUtils.publishDownloadProjectData(hustle, locale).then(function () {
                expect(hustle.publishOnce).toHaveBeenCalledWith(getHustlePayload('downloadHistoricalData'), 'dataValues');
            });
            rootScope.$apply();
        });
    });
});