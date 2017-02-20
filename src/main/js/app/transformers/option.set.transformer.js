define(["lodash"], function (_) {

    var enrichOptionSets = function (optionSets, referralLocations, excludedLineListOptions) {
        var indexedExcludedLineListOptions = _.indexBy(excludedLineListOptions, 'optionSetId');

        var enrichOptions = function (options, optionSetId, isReferralLocationOptionSet) {
            return _.map(options, function (option) {
                var excludedOptionIds = _.get(indexedExcludedLineListOptions[optionSetId], 'excludedOptionIds', []);
                var referralLocation = referralLocations && referralLocations[option.name] || {};
                option.isDisabled = _.contains(excludedOptionIds, option.id) || !!(referralLocation.isDisabled);
                option.name = (isReferralLocationOptionSet && referralLocation.name) ? referralLocation.name : option.name;
                return option;
            });
        };

        return _.map(optionSets, function (optionSet) {
            optionSet.isReferralLocationOptionSet = _.endsWith(optionSet.code, "_referralLocations");
            optionSet.options = enrichOptions(optionSet.options, optionSet.id, optionSet.isReferralLocationOptionSet);
            return optionSet;
        });
    };

    return {
        enrichOptionSets: enrichOptionSets
    };
});