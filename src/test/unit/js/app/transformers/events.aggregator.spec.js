define(['eventsAggregator'], function (eventsAggregator) {
    describe('nest', function () {
        var originA = {opUnit: 'opUnitA', module: 'moduleA', origin: 'origin'},
            originB = {opUnit: 'opUnitA', module: 'moduleB', origin: 'origin'},
            originC = {opUnit: 'opUnitA', module: 'moduleB', origin: 'origin'},
            originD = {opUnit: 'opUnitB', module: 'moduleC', origin: 'origin'};
        var list = [originA, originB, originC, originD];

        it('should recursively group the list by keys provided', function () {
            var expected = {
                opUnitA: {
                    moduleA: {
                        origin: [originA]
                    },
                    moduleB: {
                        origin: [originB, originC]
                    }
                },
                opUnitB: {
                    moduleC: {
                        origin: [originD]
                    }
                }
            };
            var actual = eventsAggregator.nest(list, ['opUnit', 'module', 'origin']);

            expect(actual).toEqual(expected);
        });

        it('should recursively group the list with counts at every level by keys provided', function () {
            var expected = {
                count: 4,
                opUnitA: {
                    count: 3,
                    moduleA: {
                        count: 1,
                        origin: [originA]
                    },
                    moduleB: {
                        count: 2,
                        origin: [originB, originC]
                    }
                },
                opUnitB: {
                    count: 1,
                    moduleC: {
                        count: 1,
                        origin: [originD]
                    }
                }
            };
            var actual = eventsAggregator.nest(list, ['opUnit', 'module', 'origin'], {includeCount: true});

            expect(actual).toEqual(expected);
        });
    });
});
