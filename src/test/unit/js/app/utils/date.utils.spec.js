define(["dateUtils", "moment", "timecop"], function(dateUtils, moment, timecop) {
    describe("date utils", function() {
        beforeEach(function() {
            Timecop.install();
            Timecop.freeze(new Date("2014-05-30T12:43:54.972Z"));
        });

        afterEach(function() {
            Timecop.returnToPresent();
            Timecop.uninstall();
        });

        it("should convert moment object to dhis week format", function() {
            var actualResult = dateUtils.toDhisFormat(moment());

            expect(actualResult).toEqual("2014W22");
        });

        it("should return max time", function() {
            var timeStrings = ["2014-05-30T12:43:54.972Z", "2014-05-30T18:43:54.972Z", "2014-04-30T12:43:54.972Z"];
            var actualResult = dateUtils.max(timeStrings);

            expect(actualResult).toEqual(moment("2014-05-30T18:43:54.972Z"));
        });

        it("should adjust for timezones and return max time", function() {
            var timeStrings = ["Wed Dec 31 2014 11:54:32 GMT+0530", "Wed Dec 31 2014 11:50:32 GMT"];
            var actualResult = dateUtils.max(timeStrings);
            expect(actualResult).toEqual(moment("Wed Dec 31 2014 11:50:32 GMT"));
        });
    });
});
