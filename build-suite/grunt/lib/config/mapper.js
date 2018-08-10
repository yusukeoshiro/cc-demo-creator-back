'use strict';

/**
 * Configuration Mapper is responsible for backwards compatibility.
 * Has the capability to write a JSON configuration file in proper (new) format.
 */
module.exports = function (grunt) {
    // Map repositories
    processRepositories();

    // Map Environment to new structure
    mapLegacyEnvironmentConfig();

    // Map "settings"
    mapLegacySettings();

    // Write migrated configuration to output if requested via command line argument
    if (grunt.option('migrate')) {
        writeMigratedConfig();
    }

    /**
     * Maps "old stype" (flat) JSON to object based environment configuration
     */
    function mapLegacyEnvironmentConfig() {
        var environment = grunt.config.get('environment');

        if (!environment.watch_path && environment['watch.path']) {
            environment.watch_path = environment['watch.path'];
        }

        delete environment['watch.path'];

        if (!environment.webdav) {
            environment.server = environment['webdav.server'];
            environment.username = environment['webdav.username'];
            environment.password = environment['webdav.password'];
        }

        delete environment['webdav.server'];
        delete environment['webdav.username'];
        delete environment['webdav.password'];

        if (!environment.two_factor && environment['webdav.two_factor']) {
            environment.two_factor = {
                enabled: environment['webdav.two_factor'],
                cert: environment['webdav.two_factor.cert'],
                password: environment['webdav.two_factor.password'],
                url: environment['webdav.server.cert.url']
            };
        }

        delete environment['webdav.two_factor'];
        delete environment['webdav.two_factor.cert'];
        delete environment['webdav.two_factor.password'];

        delete environment['webdav.server.cert.url'];

        delete environment['webdav.cartridge.root'];
        delete environment['webdav.impex.root'];
        delete environment['webdav.site_import.root'];
        delete environment['webdav.meta_import.root'];
        delete environment['webdav.captcha.root'];

        delete environment['sass.src'];
        delete environment['sass.dest'];

        // Site Import target instance is no longer necessary (bound to target environment)
        if (environment['site.import.instance']) {
            grunt.log.warn('"site.import.instance" is no longer supported. Please use target environments instead.');
        }

        delete environment.site_import;
        delete environment['site.import.instance'];

        delete environment['source.path'];
        delete environment['source.glob'];

        // Move to new env structure
        if (environment.webdav) {
            environment.server = environment.server;
            environment.username = environment.username;
            environment.password = environment.password;

            delete environment.webdav;
        }

        grunt.config.set('environments', { default: environment });
    }

    /**
     * Maps "old style" (flat) JSON to object based repository data
     */
    function mapLegacyDependencyConfig(dependency) {
        if (typeof dependency !== 'object') {
            return null;
        }

        var environment = grunt.config.get('environment');

        // Compatibility to old repository URL with implicit user+pass
        if (!dependency.repository.url) {
            var repo = dependency.repository || '';
            var type = dependency.type || null;
            var branch = dependency.branch;

            dependency.repository = {
                url: repo,
                type: type,
                branch: branch
            };
        }

        // If old repo URL, maybe we have username + password in there too? If yes, extract
        if (dependency.repository.url.indexOf('@') > 0 && dependency.repository.url.indexOf('git@') < 0) {
        // Extract Username Password from repository URL
            var arrUrl = dependency.repository.url.split('//');
            var tmpUrl = arrUrl[1] || arrUrl[0];

            // Get first part of URL, split username+password
            var substrCredentials = tmpUrl.substring(0, tmpUrl.lastIndexOf('@'));
            var credentials = substrCredentials.split(':');
            dependency.repository.username = credentials[0];
            dependency.repository.password = credentials[1];

            // Extract actual repository URL
            dependency.repository.url = 'https://' + tmpUrl.substring(tmpUrl.lastIndexOf('@') + 1);
        }

        // Compatibility to old "includeCartridges" setting
        if (!dependency.cartridges && dependency.includeCartridges) {
            grunt.log.warn('"includeCartridges" was renamed to "cartridges". Please update config.json structure.');
            dependency.cartridges = dependency.includeCartridges || [];
        }

        // Compatibility to old "global" source.path and source.glob setting
        if (!dependency.source) {
            dependency.source = {};

            if (environment['source.path']) {
                grunt.log.warn('Global source path is discouraged - please use repository-based source.path option.');
                dependency.source.path = environment['source.path'];
            }

            if (environment['source.glob']) {
                grunt.log.warn('Global source globbing is discouraged - please use source.glob option at repository.');
                dependency.source.glob = environment['source.glob'].split(',');
            }
        }

        // Pull legacy site import path to repository
        if (environment['site_import.path']) {
            if (!dependency.siteImport) {
                dependency.siteImport = {};
            }

            dependency.siteImport.initPath = environment['site_import.path'];
        }

        return dependency;
    }

    /**
     * Maps "settings" in (global) config.json to new structure
     */
    function mapLegacySettings() {
        var settings = grunt.config.get('settings');

        if (!settings.project) {
            grunt.log.warn('Mapping legacy settings structure. Please refer to documentation.');

            settings.project = {
                version: settings['build.project.version']
            };

            if (settings['build.project.number']) {
                settings.project.build = settings['build.project.number'];
            }

            if (settings['build.project.name']) {
                settings.project.name = settings['build.project.name'];
            }
        }

        delete settings['build.project.name'];
        delete settings['build.project.version'];
        delete settings['build.project.number'];

        if (!settings.general) {
            settings.general = {
                password_encryption: settings['password.encryption']
            };

            if (settings['build.target.environment']) {
                settings.general.target_environment = settings['build.target.environment'];
            }
        }

        delete settings['password.encryption'];
        delete settings['build.target.environment'];

        if (!settings.optimize) {
            settings.optimize = {
                js: settings['build.optimize.js'],
                css: settings['build.optimize.css'],
                concatenate: settings['static.files.concatenate']
            };
        }

        delete settings['build.optimize.js'];
        delete settings['build.optimize.css'];
        delete settings['static.files.concatenate'];

        if (!settings.upload) {
            settings.upload = {
                cleanup: settings['code.upload.cleanup'],
                excludehidden: settings['code.upload.excludehidden']
            };
        }

        delete settings['code.upload.granularity'];
        delete settings['code.upload.cleanup'];
        delete settings['code.upload.excludehidden'];

        var environment = grunt.config('environment');

        if (!settings.siteImport) {
            settings.siteImport = {
                enabled: !settings['build.project.codeonly'],
                sites: environment['site_import.site.filter'],
                filenames: {
                    init: settings['config.archive.name'],
                    meta: settings['meta.archive.name'],
                    content: settings['content.archive.name']
                }
            };
        }

        if (!settings.siteExport) {
            settings.siteExport = {
                sites: settings['site_export.sites']
            };
        }

        // Fetch watch path from environment configuration
        if (environment.watch_path) {
            settings.general.watch_path = environment.watch_path;
        }

        delete settings['build.project.codeonly'];
        delete settings['config.archive.name'];
        delete settings['meta.archive.name'];
        delete settings['content.archive.name'];
        delete settings['local.build.temp'];
        delete settings['svn.repository.version'];
        delete settings['build.optimize.js.debug'];
        delete settings['build.optimize.css.debug'];
        delete settings['site_export.sites'];

        delete environment['site_import.site.filter'];
        delete environment.watch_path;

        grunt.config.set('settings', settings);
    }

    /**
     * Handle repository-based mappings: Iterate over dependencies, convert to current format if legacy,
     * normalize, generate an ID
     */
    function processRepositories() {
        var deps = grunt.config.get('dependencies');
        var newDeps = [];

        // Iterate over dependencies and apply all kinds of mappings
        deps.forEach(function (dependency) {
            dependency = mapLegacyDependencyConfig(dependency);
            newDeps.push(dependency);
        });

        grunt.config.set('dependencies', newDeps);
    }

    /**
     * Configuration Migration functionality.
     *
     *  - Formats all (mapped) parts of the project configuration
     *  - Deletes legacy settings
     *  - Writes output to "config.json.new" file
     */
    function writeMigratedConfig() {
        var settings = grunt.config.get('settings');

        // Remove legacy source path/glob (was mapped already at this point)
        var environments = grunt.config.get('environments');

        // Remove legacy + generated properties from dependencies
        var dependencies = grunt.config.get('dependencies');
        var dependenciesOutput = [];
        dependencies.forEach(function (dependency) {
            delete dependency.cwd;
            delete dependency.id;
            delete dependency.type;
            delete dependency.branch;
            delete dependency.includeCartridges;

            dependenciesOutput.push(dependency);
        });

        var projectConfig = {
            dependencies: dependenciesOutput,
            environments: environments,
            settings: settings
        };

        grunt.log.writeln(JSON.stringify(projectConfig, null, 2));
        grunt.fail.warn('done.');
    }
};
