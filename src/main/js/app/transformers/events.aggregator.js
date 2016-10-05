define(['lodash'], function (_) {
    var nest = function (list, predicates, options) {
        if (!predicates.length) return list;

        var obj = _.get(options, 'includeCount') ? _.assign(_.groupBy(list, _.head(predicates)), {count: list.length}) : _.groupBy(list, _.head(predicates));

        return _.mapValues(obj, function (value) {
            return typeof value == 'number' ? value : nest(value, _.tail(predicates), options);
        });
    };

    return {
        nest: nest
    };
});