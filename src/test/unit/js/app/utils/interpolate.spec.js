define(['interpolate'], function (interpolate) {
    describe('interpolate', function () {
        var string;

        it('inserts the value of a variable', function () {
            string = 'I am {{age}} years old.';
            expect(interpolate(string, { age: 5 })).toEqual('I am 5 years old.');
        });

        it('inserts the value of a multiple variables', function () {
            string = '{{name}} is {{age}} years old.';
            expect(interpolate(string, { name: 'Kuala', age: 5 })).toEqual('Kuala is 5 years old.');
        });

        it('returns the original string if the variable is not provided', function () {
            string = 'I am {{foo}} years old.';
            expect(interpolate(string, { bar: 5 })).toEqual('I am {{foo}} years old.');
        });
    });
});