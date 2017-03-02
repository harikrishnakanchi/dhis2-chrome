define(['optionSetTransformer'], function (optionSetTransformer) {
    describe('OptionSetTransformer', function () {
        var mockedReferralLocations, mockedOptionSets, mockExcludedLineListOptions;
        beforeEach(function () {
            mockedReferralLocations = {
                "id": "some id",
                "clientLastUpdated": "some time",
                "Facility 1": {
                    "name": "Referral Location Name A",
                    "isDisabled": true
                },
                "Facility 2": {
                    "name": "Referral Location Name B",
                    "isDisabled": false
                }
            };
            mockedOptionSets = [{
                id: 'someOptionSetIdA',
                options: [{
                    id: 'optionIdC',
                    name: "OptionC name"

                }, {
                    id: 'optionIdA',
                    name: "OptionA name"

                }]
            }, {
                id: 'someOptionSetIdB',
                code: '_referralLocations',
                options: [{
                    id: 'optionIdB',
                    name: 'Facility 1'
                }, {
                    id: 'otherOption',
                    name: "Facility 2"
                }]
            }];

            mockExcludedLineListOptions = [{
                dataElementId: "someDataElementID",
                optionSetId: "someOptionSetIdA",
                excludedOptionIds: ["optionIdA"]
            }];
        });

        it('should enrich optionSet with referral Location info', function () {
            var actualResult = optionSetTransformer.enrichOptionSets(mockedOptionSets, mockedReferralLocations, mockExcludedLineListOptions);
            expect(actualResult).toContain(jasmine.objectContaining({id: 'someOptionSetIdB', isReferralLocationOptionSet: true}));
            expect(actualResult).toContain(jasmine.objectContaining({id: 'someOptionSetIdA', isReferralLocationOptionSet: false}));
        });

        it('should set isDisabled attribute to options if option is excluded', function () {
            mockedOptionSets = [mockedOptionSets[0]];
            var actualResult = optionSetTransformer.enrichOptionSets(mockedOptionSets, mockedReferralLocations, mockExcludedLineListOptions);
            expect(actualResult[0].options).toContain(jasmine.objectContaining({id : "optionIdA", isDisabled: true}));
            expect(actualResult[0].options).toContain(jasmine.objectContaining({id : "optionIdC", isDisabled: false}));
        });

        it('should set isDisabled to true to option for disabled referral location in referral location optionSet', function () {
            mockedOptionSets = [mockedOptionSets[1]];
            var actualResult = optionSetTransformer.enrichOptionSets(mockedOptionSets, mockedReferralLocations, mockExcludedLineListOptions);
            expect(actualResult[0].options).toContain(jasmine.objectContaining({id : "optionIdB", isDisabled: true}));
            expect(actualResult[0].options).toContain(jasmine.objectContaining({id : "otherOption", isDisabled: false}));
        });

        it('should replace name of the option for referral optionSet', function () {
            mockedOptionSets = [mockedOptionSets[1]];
            var actualResult = optionSetTransformer.enrichOptionSets(mockedOptionSets, mockedReferralLocations, mockExcludedLineListOptions);
            expect(actualResult[0].options).toContain(jasmine.objectContaining({name : "Referral Location Name A", isDisabled: true}));
            expect(actualResult[0].options).toContain(jasmine.objectContaining({name : "Referral Location Name B", isDisabled: false}));
        });

    });

});