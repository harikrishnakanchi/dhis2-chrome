define([], function() {
    return function(result, catageroryOptionCombo) {
        var catOptions = catageroryOptionCombo.categoryOptions;
        var i, j = 0;

        for (i = 0; i < catOptions.length; i++) {
            result[i] = result[i] || [];
            option = catOptions[i];
            result[i].push(option.name);
            result[i] = _.uniq(result[i]);
        }

        for (i = 1; i < result.length; i++) {
            for (j = 0; j < result[i - 1].length - 1; j++) {
                var temp = result[i];
                result[i] = result[i].concat(temp);
            }
        }

        return result;
    };
});