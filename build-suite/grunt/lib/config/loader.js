'use strict';

var Encryption = require('./encryption');

/**
 * Configuration loader
 *
 *  - Checks for single vs. multi config.json
 *  - Loads given config file(s), either "config.json" or provided via --project
 *  - Selects target environment in multi-environment config (given in config or via --environment)
 *
 */
module.exports = function (grunt) {
    var encryption = new Encryption(grunt);

    var configFileName = getConfigFilename();
    var configData = loadConfigFile(configFileName);

    // Validate data
    if (!configData || !configData.settings) {
        grunt.fail.fatal('Missing "settings" property in configuration!');
    }

    grunt.config.set('settings', configData.settings);

    // Check for single- vs. multi-configuration file setup
    if (!(configData.environment || configData.environments) && !configData.dependencies) {
        // Environment + Dependency config not given? => Fallback to old 2-file-config.
        grunt.log.writeln('   * Found configuration based on two files.');

        var projectFilename = getProjectFilename();
        var projectData = loadConfigFile(projectFilename);

        if (!projectData.environment && !projectData.environments) {
            grunt.fail.fatal('Missing "environment" configuration!');
        }

        checkDependencies(projectData.dependencies);

        // Write dependencies + environment config from project file to
        grunt.config.set('dependencies', projectData.dependencies);
        grunt.config.set('environment', projectData.environment);

        // Password encryption/decryption
        encryption.run(projectFilename);
    } else {
        checkDependencies(configData.dependencies);

        // Load Environment + Dependency config from single file
        grunt.config.set('dependencies', configData.dependencies);

        var targetEnvironment = loadTargetEnvironment(configData);
        grunt.config.set('environment', targetEnvironment);

        // Password encryption/decryption
        encryption.run(configFileName);
    }


    /**
     * Loads the configuration file's name, as it might be given via command line argument.
     */
    function getConfigFilename() {
        var filename;

        if (grunt.option('project') && grunt.option('project').length > 0) {
            filename = 'build/' + grunt.option('project') + '.json';
        } else {
            filename = grunt.config.get('dw_properties.configFile');
        }

        return filename;
    }

    /**
     * Loads the "project-based" configuration if two-file-approach is used.
     */
    function getProjectFilename() {
        var projectName = configData.settings['build.project.name'];

        if (!projectName) {
            projectName = configData.settings.project.name;
        }

        if (!projectName) {
            grunt.fail.fatal('Could neither find complete configuration in config file nor was project name given.');
        }

        return 'build/projects/' + projectName + '/config.json';
    }

    /**
     * Loads a configuration file and returns a JSON representation of the contained configuration
     */
    function loadConfigFile(filename) {
        grunt.log.write('   * Loading ' + filename + '... ');

        if (!grunt.file.exists(filename)) {
            grunt.fail.fatal('file does not exist.');
        }

        var filecontent = grunt.file.read(filename);

        try {
            var configData = JSON.parse(replaceEnvironmentVariables(grunt, filecontent));
            grunt.log.ok();

            return configData;
        } catch (e) {
            grunt.fail.fatal(e.toString());
        }
    }

    /**
     * Find target deployment environment in configuration
     *
     * Considers either single "environment", multi "environments" with either only one entry or target key given.
     */
    function loadTargetEnvironment(configData) {
        // Environments given in both ways?
        if (configData.environment && configData.environments) {
            grunt.fail.fatal('Found both old and new style environment(s) configuration. Please remove unused one.');
        }

        if (configData.environments) {
            // Multi-Environment config style found
            var environmentsCount = Object.keys(configData.environments).length;

            if (environmentsCount === 0) {
                grunt.fail.fatal('No environments provided.');
            }

            var targetEnvKey = configData.settings.general ? configData.settings.general.target_environment : false;

            // Command line argument overrides configuration
            if (grunt.option('target')) {
                targetEnvKey = grunt.option('target');
            }

            // If no target env found until here, check for only one entry in list
            if (!targetEnvKey) {
                if (environmentsCount > 1) {
                    grunt.fail.fatal('Multiple environments given but no target environment defined.');
                }

                // Only one environment in list - obvious.
                if (environmentsCount === 1) {
                    targetEnvKey = Object.keys(configData.environments)[0];
                }
            }

            if (!configData.environments[targetEnvKey]) {
                grunt.fail.fatal('Target environment "' + targetEnvKey + '" does not exist.');
            }

            grunt.log.writeln('   * Found target environment: ' + targetEnvKey);

            // "Store" target environment in corresponding config value
            if (!configData.settings.general) {
                configData.settings.general = {};
            }

            configData.settings.general.target_environment = targetEnvKey;

            return configData.environments[targetEnvKey];
        }

        // "Classic" single-environment style
        return configData.environment;
    }

    /**
     * Replaces any instance of ${VAR_NAME} with the the evaluated value of process.env.VAR_NAME
     *
     * Contributors: patmat, jba-amblique
     */
    function replaceEnvironmentVariables(grunt, original) {
        // Only replace in strings
        if (typeof original !== 'string') {
            return original;
        }

        var tokenRegExp = new RegExp('\\$\\{(.+?)\\}', 'g');

        return original.replace(tokenRegExp, function (a, b) {
            var environmentVariableValue = process.env[b] || grunt.option(b);
            if (typeof environmentVariableValue !== 'undefined') {
                environmentVariableValue.toString().replace(/(^\s*)|(\s*$)/, '');
                grunt.log.verbose.writeln('    ...applied injected value from ENV/CMD to "' + b + '" placeholder.');
            }

            return environmentVariableValue;
        });
    }

    /**
     * Check if Dependencies are configured and have a repository + location set.
     *
     * @param {Array} dependencies
     */
    function checkDependencies(dependencies) {
        if (!dependencies || dependencies.length == 0) {
            grunt.fail.fatal('No dependencies found in configuration!');
        }

        // Check for repository and repository location presence
        dependencies.forEach((dependency, index) => {
            if (!dependency.repository) {
                grunt.fail.fatal('Missing repository configuration for dependency #' + index + '.');
            }

            if (!dependency.repository.url) {
                grunt.fail.fatal('Missing repository location (url property) for dependency #' + index + '.');
            }
        });
    }
};

