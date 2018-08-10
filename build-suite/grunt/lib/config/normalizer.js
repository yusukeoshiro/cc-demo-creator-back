'use strict';

var path = require('path');

/**
 * Ensures configuration properties have a proper format and default values are set.
 */
module.exports = function (grunt) {
    processSettings();
    processEnvironment();
    processRepositories();

    printConfig();

    /**
     * Do some normalization on the global settings
     */
    function normalizeSettings(settings) {
        if (!settings.project) {
            settings.project = {};
        }

        if (!settings.project.version) {
            grunt.fail.fatal('Version name missing (settings.project.version)');
        }

        if (!settings.project.name) {
            // Try to load project name from command line parameter
            if (grunt.option('project') && grunt.option('project').length > 0) {
                settings.project.name = grunt.option('project');
            } else {
                settings.project.name = 'UNNAMED';
                grunt.log.warn('Project name missing (settings.project.name)');
            }
        }

        if (!settings.general) {
            settings.general = {};
        } else if (settings.general.password_encryption) {
            settings.general.password_encryption = settings.general.password_encryption.toString();
        }

        if (!settings.optimize) {
            settings.optimize = {};
        } else {
            if (settings.optimize.js) {
                settings.optimize.js = settings.optimize.js.toString();
            }

            if (settings.optimize.css) {
                settings.optimize.css = settings.optimize.css.toString();
            }

            if (settings.optimize.concatenate) {
                settings.optimize.concatenate = settings.optimize.concatenate.toString();
            }

            if (settings.optimize.postcss === undefined) {
                settings.optimize.postcss = true;
            }

            if (settings.optimize.browserify === undefined) {
                settings.optimize.browserify = true;
            }
        }

        if (!settings.upload) {
            settings.upload = {};
        }

        if (!settings.siteExport) {
            settings.siteExport = {};
        }

        if (!settings.siteImport) {
            settings.siteImport = {};
        }

        if (!settings.siteImport.filenames) {
            settings.siteImport.filenames = {};
        }

        if (settings.siteImport.filenames.content && !settings.siteImport.filenames.content.endsWith('.zip')) {
            settings.siteImport.filenames.content += '.zip';
        }

        if (!settings.sass) {
            settings.sass = { };
        }

        if (settings.sass.enabled === undefined) {
            settings.sass.enabled = true;
        }

        if (!settings.sass.sourcePath) {
            settings.sass.sourcePath = 'scss';
        }

        if (!settings.sass.sourceFile) {
            settings.sass.sourceFile = 'style.scss';
        }

        return settings;
    }

    /**
     * Checks for repository type and, if not given, tries to interpret URL
     */
    function normalizeEnvironmentData(environment) {
        if (!environment.two_factor) {
            environment.two_factor = { enabled: 'false' };
        }

        if (environment.two_factor.enabled.toString() === 'true') {
            grunt.log.writeln('   * Two factor auth enabled. Certificate file: ' + environment.two_factor.cert);

            if (!grunt.file.exists(environment.two_factor.cert)) {
                grunt.fail.fatal('Certificate file could not be loaded.');
            }

            // Check if correct URL for 2factor auth is used
            if (!environment.two_factor.url || environment.two_factor.url.indexOf('cert') !== 0) {
                grunt.fail.fatal('Incorrect host for two factor auth (must begin with "cert."): ' + environment.two_factor.url);
            }
        }

        return environment;
    }

    /**
     * Checks for repository type and, if not given, tries to interpret URL
     */
    function normalizeRepositoryData(dependency) {
        var url = dependency.repository.url;

        if (!dependency.source) {
            dependency.source = {};
        }

        // Write default source path
        if (!dependency.source.path) {
            dependency.source.path = 'cartridges';
        }

        // Write default source globbing
        if (!dependency.source.glob) {
            dependency.source.glob = '**/*';
        }

        // Remove trailing slashes
        if (dependency.repository.url.lastIndexOf('/') === dependency.repository.url.length - 1) {
            dependency.repository.url = url.substring(0, dependency.repository.url.length - 1);
        }

        // Try and detect the type if it wasn't explicity passed.
        if (!dependency.repository.type) {
            if (url.indexOf('git@') === 0 || url.indexOf('.git') === Math.max(url.length - 4, 0)) {
                // Is this a Git repository?
                dependency.repository.type = 'git';
            } else if (url.indexOf('svn') > -1) {
                // ...or an SVN repository?
                dependency.repository.type = 'svn';
            } else {
                // ...must be file then
                dependency.repository.type = 'file';
            }
        }

        // Check for relative local paths and resolve them
        if (dependency.repository.type === 'file' && url.indexOf('file:') !== 0 &&
        url.indexOf('/') !== 0 && url.indexOf('\\') !== 0) {
            url = 'file://' + path.resolve(url);
            url = url.replace(/\\/g, '/');

            dependency.repository.url = url;
        }

        if (!dependency.cartridges) {
            dependency.cartridges = [];
        }

        return dependency;
    }

    /**
     * Extracts project name from the repository URL. Needed for decent logging/output.
     */
    function setDependencyId(dependency) {
        if (dependency.id && dependency.id.length > 2) {
            return dependency;
        }

        var url = dependency.repository.url;

        // dependency ID is the last part of the repository URL (Either behind last / or : for Git URLs)
        var containsSlash = url.indexOf('/') !== -1;
        var index = containsSlash ? (url.lastIndexOf('/') + 1) : url.lastIndexOf(':');

        var projectId = url.slice(index);

        // Clean ".git" off the end of the repository name in case of Git Repo
        projectId = projectId.replace('.git', '');

        // Dots will screw up the task reference so we replace all of them
        projectId = projectId.replace(/\./g, '_');

        // ID must be longer than
        if (projectId.length < 2) {
            grunt.fail.warn('Project name could not be extracted. ' +
          'Please check or assign manually. URL: ' + dependency.repository.url +
          ', Project name: ' + projectId);
        }

        dependency.id = projectId;
        return dependency;
    }

    /**
     * Determines the (target) CWD for each dependency, checks existence of local repositories
     */
    function setDependencyCwd(dependency) {
        // Set CWD for each dependency
        dependency.cwd = grunt.config('dw_properties').folders.repos +
        dependency.id + '/' + dependency.source.path;

        // If local repository: Modify CWD and check path
        if (dependency.repository.type === 'file') {
            dependency.cwd = path.normalize(dependency.repository.url.slice('file://'.length) +
          '/' + dependency.source.path);

            if (!grunt.file.isDir(dependency.cwd)) {
                grunt.log.warn('Repository "' + dependency.id + '": Cartridge directory (' + dependency.cwd +
            ') does not exist.');
            }
        }

        return dependency;
    }

    /**
     * Normalize environment data, set default values
     */
    function processEnvironment() {
        var environment = grunt.config.get('environment');

        if (!environment) {
            grunt.fail.fatal('missing "environment" configuration.');
        }

        environment = normalizeEnvironmentData(environment);

        grunt.config.set('environment', environment);
    }

    /**
     * Normalize build suite settings
     */
    function processSettings() {
        var settings = grunt.config.get('settings');
        settings = normalizeSettings(settings);

        grunt.config.set('settings', settings);
    }

    /**
     * Normalize repository data, generate dependency IDs, build CWD path
     */
    function processRepositories() {
        var deps = grunt.config.get('dependencies');
        var newDeps = [];

        // Iterate over dependencies and apply all kinds of mappings
        deps.forEach(function (dependency) {
            dependency = normalizeRepositoryData(dependency);
            dependency = setDependencyId(dependency);
            dependency = setDependencyCwd(dependency);

            newDeps.push(dependency);
        });

        grunt.config.set('dependencies', newDeps);
    }

    /**
     * Check for "--print-config" parameter and print config to output if given
     */
    function printConfig() {
        if (!grunt.option('print-config')) {
            return;
        }

        if (grunt.option('print-config') === true) {
        // Complete config output
            grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
        } else {
        // Selective output
            grunt.log.writeln(" *** Config for '" + grunt.option('print-config') + "':");
            grunt.log.writeln(JSON.stringify(grunt.config(grunt.option('print-config')), null, 2));
        }
    }
};
