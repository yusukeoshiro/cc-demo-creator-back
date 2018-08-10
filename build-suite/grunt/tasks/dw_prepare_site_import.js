'use strict';

/**
 *  Create site import configuration structure
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_prepare_site_import', 'Create site import package', function () {
        var options = this.options();
        var settings = grunt.config.get('settings');

        var enabled = settings.siteImport.enabled;

        if (enabled && enabled.toString().toLowerCase() !== 'true') {
            grunt.fail.warn('Site import is disabled in Settings.');
        }

        var siteImport = require('../lib/util/site_import')(grunt);
        siteImport.cleanup();

        // Import site initialization data if set
        if (options.importInit) {
            grunt.log.writeln(' -- Collecting data for Site Initialization');
            siteImport.copySiteInitData();
        }

        // Import demo site if set
        if (options.importDemo) {
            grunt.log.writeln(' -- Collecting Demo Data.');
            siteImport.copySiteDemoData();
        }

        // Instance-specific import and application of eventually configured replacement
        var instanceConfig = loadInstanceConfig(options.targetEnv);

        if (instanceConfig) {
            grunt.log.writeln(' -- Applying replacements for ' + options.targetEnv);
            siteImport.updateData(instanceConfig);

            siteImport.copyEnvOverrides(options.targetEnv);
        }

        if (!siteImport.checkForFiles()) {
            grunt.fail.warn('No files found for site import. ' +
            'Please check setup, run build and check again.');
        }
    });

    /**
     * Loads instance-based configuration data
     *
     * @param {string} targetInstance - Target instance identifier
     */
    function loadInstanceConfig(targetInstance) {
        var instanceConfig;

        // Load corresponding config if target instance is given
        if (targetInstance) {
            var instanceConfigFile = grunt.config('dw_properties').folders.site +
          'config/' + targetInstance + '/config.json';

            grunt.log.verbose.writeln(' -- Reading instance configuration from: ' + instanceConfigFile);

            if (grunt.file.exists(instanceConfigFile)) {
                instanceConfig = grunt.file.readJSON(instanceConfigFile);
                grunt.log.verbose.writeln('  - Using environment configuration: ' + instanceConfigFile);
            }

            if (!instanceConfig) {
                grunt.log.writeln(' -- No environment-specific configurations found for ' + targetInstance);
            } else {
                grunt.log.writeln(' -- Found environment-specific configuration for ' + targetInstance);
            }
        }

        return instanceConfig;
    }
};
