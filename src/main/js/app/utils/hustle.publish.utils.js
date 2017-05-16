define([], function () {
    var publishDownloadProjectData = function ($hustle, locale) {

        var publishToHustle = function (type) {
            return $hustle.publishOnce({
                type: type,
                data: [],
                locale: locale
            }, 'dataValues');
        };

        return publishToHustle('downloadModuleDataForProject')
            .then(_.partial(publishToHustle,'downloadReportDefinitions'))
            .then(_.partial(publishToHustle,'downloadReportData'))
            .then(_.partial(publishToHustle,'downloadHistoricalData'));
    };

    return {
        "publishDownloadProjectData": publishDownloadProjectData
    };
});