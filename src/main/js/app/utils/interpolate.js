define([], function () {
    return function (string, variables) {
        return string.replace(/{{([^{}]*)}}/g,
            function (interpolatedExpression, interpolatedVariableName) {
                var interpolatedValue = variables[interpolatedVariableName];
                return typeof interpolatedValue === 'string' || typeof interpolatedValue === 'number' ? interpolatedValue : interpolatedExpression;
            }
        );
    };
});