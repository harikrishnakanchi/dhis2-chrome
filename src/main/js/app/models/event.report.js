define([], function () {
    var EVENT_REPORT_TITLE_REGEX = /^\[Praxis - ([a-zA-Z0-9()><]+)\]([0-9\s]*)([a-zA-Z0-9-\s)><(&\/\\=%\+']+)/;
    var PROGRAM_CODE_INDEX = 1;
    var DISPLAY_POSITION_INDEX = 2;
    var TITLE_INDEX = 3;

    var EventReport = function (config) {
        this.id = config.id;
        this.name = config.name;

        this.translations = config.translations;
        this.columns = config.columns;
        this.rows = config.rows;
        this.categoryDimensions = config.categoryDimensions;
        this.dataElementDimensions = config.dataElementDimensions;

        this.title = parseTitle(config.name);
        this.serviceCode = parseProgramName(config.name);
        this.displayPosition = parseDisplayPosition(config.name);

        this.weeklyReport = isReportOfType(config.relativePeriods, "Week");
        this.monthlyReport = isReportOfType(config.relativePeriods, "Month");
    };

    var parseTitle = function (eventReportName) {
        var matches = EVENT_REPORT_TITLE_REGEX.exec(eventReportName);
        return (matches && matches[TITLE_INDEX]) ? matches[TITLE_INDEX] : "";
    };

    var parseProgramName = function (eventReportName) {
        var matches = EVENT_REPORT_TITLE_REGEX.exec(eventReportName);
        return matches && matches[PROGRAM_CODE_INDEX];
    };

    var parseDisplayPosition = function (eventReportName) {
        var matches = EVENT_REPORT_TITLE_REGEX.exec(eventReportName);
        return matches && matches[DISPLAY_POSITION_INDEX] ? parseInt(matches[DISPLAY_POSITION_INDEX]) : null;
    };

    var isReportOfType = function (relativePeriods, typeOfReport) {
        var selectedPeriod = _.findKey(relativePeriods, function (value) { return value; });
        return _.contains(selectedPeriod, typeOfReport);
    };

    EventReport.create = function () {
        var eventReport = Object.create(EventReport.prototype);
        EventReport.apply(eventReport, arguments);
        return eventReport;
    };

    return EventReport;
});
