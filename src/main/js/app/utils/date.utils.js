define(["moment", "lodash"], function(moment, _) {
    var ISO_8601_DATE_FORMAT = 'YYYY-MM-DD';

    var toDhisFormat = function(m) {
        return m.format("GGGG[W]WW");
    };

    var getFormattedPeriod = function(period) {
        return moment(period, "GGGG[W]W").format("GGGG[W]WW");
    };

    var toISODate = function (datetime) {
        return moment.utc(datetime).format(ISO_8601_DATE_FORMAT);
    };

    var max = function(dateStrings) {
        var epochs = function(d) {
            return moment(d).valueOf();
        };
        var max = _.max(dateStrings, epochs);
        return moment(max);
    };

    var subtractWeeks = function(numberOfWeeks) {
        return moment().subtract(numberOfWeeks, 'week').format("YYYY-MM-DD");
    };

    var getPeriodRange = function(type, total, options) {
        options = options || {};
        var difference = options.excludeCurrent ? total : total - 1;

        var format;
        if (type === 'week') format = 'GGGG[W]WW';
        if (type === 'month') format = 'YYYYMM';

        return _.times(total, function(index) {
            return moment().subtract(difference - index, type).format(format);
        });
    };

    var getPeriodRangeInWeeks = _.partial(getPeriodRange, 'week');
    var getNumberOfISOWeeksInMonth = function (month) {
        var monthMoment = moment(month, 'YYYYMM'),
            daysInMonth = _.range(1, monthMoment.daysInMonth() + 1);

        return _.reduce(daysInMonth, function(numberOfMondays, day) {
            return numberOfMondays + (monthMoment.date(day).day() == 1 ? 1 : 0);
        }, 0);
    };

    return {
        toDhisFormat: toDhisFormat,
        toISODate: toISODate,
        max: max,
        getFormattedPeriod: getFormattedPeriod,
        subtractWeeks: subtractWeeks,
        getPeriodRangeInWeeks: getPeriodRangeInWeeks,
        getNumberOfISOWeeksInMonth: getNumberOfISOWeeksInMonth
    };
});
