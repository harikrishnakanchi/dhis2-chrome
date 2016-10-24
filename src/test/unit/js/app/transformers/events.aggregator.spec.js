define(['eventsAggregator'], function (eventsAggregator) {
    describe('eventsAggregator', function () {
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

        describe('buildEventsTree', function () {
            var events, eventA, eventB, eventC, eventD;

            beforeEach(function () {
                eventA = {
                    period: '2016W14',
                    dataValues: [{
                        dataElement: 'dataElementId1',
                        value: 'optionA'
                    }, {
                        dataElement: 'dataElementId2',
                        value: 'optionX'
                    }]
                };
                eventB = {
                    period: '2016W14',
                    dataValues: [{
                        dataElement: 'dataElementId1',
                        value: 'optionA'
                    }, {
                        dataElement: 'dataElementId2',
                        value: 'optionY'
                    }]
                };
                eventC = {
                    period: '2016W15',
                    dataValues: [{
                        dataElement: 'dataElementId1',
                        value: 'optionB'
                    }, {
                        dataElement: 'dataElementId2',
                        value: 'optionX'
                    }]
                };
                eventD = {
                    period: '2016W16',
                    dataValues: [{
                        dataElement: 'dataElementId1',
                        value: 'optionB'
                    }, {
                        dataElement: 'dataElementId2',
                        value: 'optionY'
                    }]
                };
                events = [eventA, eventB, eventC, eventD];
            });

            it('should transform events by specified groups recursively', function () {
                var expectedTree = {
                    dataElementId1: {
                        optionA: {
                            count: 2,
                            '2016W14': [eventA, eventB]
                        },
                        optionB: {
                            count: 2,
                            '2016W15': [eventC],
                            '2016W16': [eventD]
                        }
                    },
                    dataElementId2: {
                        optionX: {
                            count: 2,
                            '2016W14': [eventA],
                            '2016W15': [eventC]
                        },
                        optionY: {
                            count: 2,
                            '2016W14': [eventB],
                            '2016W16': [eventD]
                        }
                    }
                };

                var dataElementIds = ['dataElementId1', 'dataElementId2'];

                var actualTree = eventsAggregator.buildEventsTree(events, ['period'], dataElementIds);
                expect(actualTree).toEqual(expectedTree);
            });

            it('should not include data elements for which no data values exist', function () {
                var eventsTree = eventsAggregator.buildEventsTree(events, ['period'], ['someDataElementId']);
                expect(eventsTree.someDataElementId).toBeUndefined();
            });
        });
    });
});
