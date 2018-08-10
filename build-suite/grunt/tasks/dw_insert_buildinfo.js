module.exports = function (grunt) {
    grunt.registerMultiTask('dw_insert_buildinfo',
        'Insert Build Information into Storefront Toolkit',
        function () {
        /**
         * Replaces placeholders in build info isml template with actual build information
         */
            function insertInformation(template) {
                var settings = grunt.config.get('settings');
                var now = new Date();

                template = template.replace(/@BUILD_TIME@/, now.toLocaleString());
                template = template.replace(/@BUILT_BY@/, process.env.USER || process.env.USERNAME || '(unknown)');
                template = template.replace(/@DEPLOYMENT_PROJECT@/, settings.project.name || '(not set)');
                template = template.replace(/@DEPLOYMENT_VERSION@/, settings.project.version || '(not set)');
                template = template.replace(/@REVISION@/, settings.project.build || '(not set)');

                return template;
            }

            var options = this.options();

            // First, check if the build info instertion is enabled
            if (grunt.config.get('settings.storefront_build_information.enabled') !== true) {
                grunt.log.writeln('Build info insertion disabled. Skipping.');
                return;
            }

            // Check if target/storefront cartridge was configured
            if (!options.cartridge.length) {
                grunt.log.writeln('No target cartridge given. Using default.');
                options.cartridge = 'app_storefront_core';
            }

            // No template given? Use default.
            if (!options.template.length) {
                grunt.log.writeln('No target template given. Using default.');
                options.template = 'default/components/footer/footer.isml';
            }

            // Generate cartridge + template paths
            var cartridgePath = grunt.config('dw_properties').folders.code + options.cartridge;
            var templatePath = cartridgePath + '/cartridge/templates/';

            grunt.log.writeln('Storefront Toolkit Build Information enabled.');

            // Check if target/storefront cartridge was included in the build
            if (!grunt.file.exists(cartridgePath)) {
                var errorMsg = 'Target cartridge ("' + options.cartridge + '") not found.';
                grunt.log.warn('Unable to insert Build info: ' + errorMsg);
                return;
            }

            grunt.log.write('Generating build info template... ');

            // Load ISML.template file and replace build information into it
            var buildInfoTemplateContent = grunt.file.read('resources/build_info.isml.template');
            buildInfoTemplateContent = insertInformation(buildInfoTemplateContent);

            // Write output to target location as actual ISML file
            var buildInfoTemplateFile = templatePath + options.infoTemplatePath + '/' + options.infoTemplateFile;
            grunt.file.write(buildInfoTemplateFile, buildInfoTemplateContent);
            grunt.log.ok();

            // Add include for build info template to the given target template
            grunt.log.write('Adding include for build info template... ');

            var includeTemplateFile = templatePath + options.template;

            // Check if target template exists
            if (!grunt.file.exists(includeTemplateFile)) {
                grunt.log.warn('Unable to include Build info: Target template ("' + options.template + '") not found.');
                return;
            }

            // Load target template
            var includeTemplateContent = grunt.file.read(includeTemplateFile);
            var includeString = '<isinclude template="' + options.infoIncludeString + '">';

            // Check if include already exists in target template (e.g. if copy task was not called since last run)
            if (includeTemplateContent.match(new RegExp(includeString, 'g'))) {
                grunt.log.writeln('Include already exists.');
                return;
            }

            // Append include to file and save it
            grunt.file.write(includeTemplateFile, includeTemplateContent + '\n' + includeString);
            grunt.log.ok();
        });
};
