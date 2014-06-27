define(["systemSettingConsumer"], function(SystemSettingConsumer) {

    describe("systemSettingConsumer", function() {
        var consumer, systemSettingService, systemSetting, message;

        beforeEach(function() {
            systemSettingService = jasmine.createSpyObj({}, ['excludeDataElements']);

            var projectId = "12445";

            var expectedSystemSettings = {
                "excludedDataElements": {
                    "1": ["123452", "123457"]
                }
            };

            systemSetting = {
                projectId: projectId,
                settings: expectedSystemSettings
            };

            message = {
                data: {
                    data: systemSetting,
                    type: "excludeDataElements"
                }
            };
            consumer = new SystemSettingConsumer(systemSettingService);
        });

        it("should create system settings for a project", function() {
            consumer.run(message);
            expect(systemSettingService.excludeDataElements).toHaveBeenCalledWith(systemSetting);
        });
    });
});