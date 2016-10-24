define(['lodash'], function (_) {
    var NO_VALUE = 'noValue';

    var nest = function (collection, predicates, options) {
        if (!predicates.length) return collection;

        var obj = _.get(options, 'includeCount') ? _.assign(_.groupBy(collection, _.head(predicates)), {count: collection.length}) : _.groupBy(collection, _.head(predicates));

        return _.mapValues(obj, function (value) {
            return typeof value == 'number' ? value : nest(value, _.tail(predicates), options);
        });
    };

    var buildEventsTree = function (events, groupingCriteria, dataElementIdsForSummary) {
        events = _.each(events, function (event) {
            event.dataValues = _.reduce(event.dataValues, function(result, dataValue) {
                if(dataValue.value) result[dataValue.dataElement] = dataValue.value;
                return result;
            }, {});
        });

        return _.reduce(dataElementIdsForSummary, function (tree, dataElementId) {
            var eventsGroupedByOptions = _.groupBy(events, function (event) {
                return event.dataValues[dataElementId] || NO_VALUE;
            });

            var noDataValuesExistForDataElement = _.isEqual(_.keys(eventsGroupedByOptions), [NO_VALUE]);
            return noDataValuesExistForDataElement ? tree : _.set(tree, dataElementId, _.mapValues(eventsGroupedByOptions, _.partial(nest, _, groupingCriteria, {includeCount: true})));
        }, {});
    };

    return {
        nest: nest,
        buildEventsTree: buildEventsTree
    };
});