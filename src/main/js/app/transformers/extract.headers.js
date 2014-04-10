define([], function() {
    return function(catageroryOptionCombos) {
        var i = 0;
        var j = 0;
        var temp = [];
        var result = [];
        var catOptions;

        for (j = 0; j < catageroryOptionCombos.length; j++) {
            catOptions = catageroryOptionCombos[j].categoryOptions;
            for (i = 0; i < catOptions.length; i++) {
                temp[i] = temp[i] || [];
                temp[i].push(catOptions[i].name);
                temp[i] = _.uniq(temp[i]);
            }
        }

        var dimensions = [];
        for (i = 0; i < temp.length; i++) {
            dimensions.push(temp[i].length);
        }


        var divideWith = 1;
        for (i = 0; i < dimensions.length; i++) {
            catOptions = catageroryOptionCombos[i].categoryOptions;

            divideWith *= dimensions[i];
            result[i] = result[i] || [];
            var addFactor = catageroryOptionCombos.length / divideWith;

            for (j = 0; j < catageroryOptionCombos.length; j += addFactor) {
                var option = catageroryOptionCombos[j].categoryOptions[i];
                result[i].push({
                    "label": option.name,
                    "id": catageroryOptionCombos[j].id,
                    "span": i === dimensions.length - 1 ? 1 : dimensions[i + 1]
                });
            }
        }
        return result;
    };
});