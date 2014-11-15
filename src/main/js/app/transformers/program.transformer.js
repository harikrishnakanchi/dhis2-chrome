define(["lodash", "programTransformer"], function(_, programTransformer) {
    var addModules = function(allPrograms, programWiseModules, enrichedModules) {
        return _.map(_.keys(programWiseModules), function(programId) {
            var program = _.find(allPrograms, {
                "id": programId
            });

            var orgUnitsToAssociate = _.map(programWiseModules[programId], function(module) {
                return {
                    "id": _.find(enrichedModules, {
                        "name": module.name
                    }).id,
                    "name": module.name
                };
            });

            program.organisationUnits = program.organisationUnits.concat(orgUnitsToAssociate);
            program.orgUnitIds = _.pluck(program.organisationUnits, "id");
            return program;
        });
    };

    return {
        "addModules": addModules
    };
});