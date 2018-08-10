'use strict';

var path = require('path');
var fs = require('fs');

/**
 * Set up site import based on configuration.
 *
 * Consists of 3 parts: initialization, demo data and target instance based replacements
 * Everything is copied to output folder, the import task decides which of the parts are actually imported.
 */
function configureSiteImport(grunt, dependency, settings) {
    // Default paths
    var siteInitPath = 'sites/site_template';
    var siteDemoPath = 'sites/site_demo';
    var environmentPath = 'sites/config';

    // Base path of local checkout
    var basePath = grunt.config('dw_properties').folders.repos;

    // Check for Repository-based site import paths
    if (dependency.siteImport) {
        siteInitPath = dependency.siteImport.initPath || siteInitPath;
        siteDemoPath = dependency.siteImport.demoPath || siteDemoPath;
        environmentPath = dependency.siteImport.environmentPath || environmentPath;
    }

    // Build complete relative site import paths
    var initSourceDir = basePath + dependency.id + '/' + siteInitPath;
    var demoSourceDir = basePath + dependency.id + '/' + siteDemoPath;
    var environmentSourceDir = basePath + dependency.id + '/' + environmentPath;

    // Handle local repository
    if (dependency.repository.type === 'file') {
        var baseDir = dependency.repository.url.slice('file://'.length);

        initSourceDir = path.normalize(baseDir + '/' + siteInitPath);
        demoSourceDir = path.normalize(baseDir + '/' + siteDemoPath);
        environmentSourceDir = path.normalize(baseDir + '/' + environmentPath);
    }

    grunt.log.writeln('      - Init data source: ' + initSourceDir);

    var filter = settings.siteImport && settings.siteImport.sites;
    var siteImportSrc = ['**/*'];
    if (filter && typeof filter.map == 'function') {
        siteImportSrc.push('!sites/**/*');
        siteImportSrc = siteImportSrc.concat(filter.map(site => 'sites/' + site + '/**/*'));
        grunt.log.writeln('        - Found site filter, calculated globbing pattern: ' + siteImportSrc);
    }

    grunt.log.writeln('      - Demo data source: ' + demoSourceDir);
    grunt.log.writeln('      - Instance config source: ' + environmentSourceDir);

    grunt.config('copy.site_init_' + dependency.id, {
        cwd: initSourceDir,
        src: siteImportSrc,
        dest: grunt.config('dw_properties').folders.site + 'site_init',
        expand: true,
        dot: false
    });

    grunt.config('copy.site_demo_' + dependency.id, {
        cwd: demoSourceDir,
        src: '**/*',
        dest: grunt.config('dw_properties').folders.site + 'site_demo',
        expand: true,
        dot: false
    });

    grunt.config('copy.env_config_' + dependency.id, {
        cwd: environmentSourceDir,
        src: '**/*',
        dest: grunt.config('dw_properties').folders.site + 'config',
        expand: true,
        dot: false
    });

    grunt.task.run('copy:site_init_' + dependency.id);
    grunt.task.run('copy:site_demo_' + dependency.id);
    grunt.task.run('copy:env_config_' + dependency.id);
}

/**
 * Copy all source repositories to output folder
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_copy', 'Copy repositories to output folder, apply filters.', function () {
        var dependencies = grunt.config('dependencies');
        var settings = grunt.config('settings');

        dependencies.forEach(function (dependency) {
            grunt.log.writeln('   ** Repository: ' + dependency.id);

            var nonull = !dependency.source.ignoreEmpty;
            var dot = !settings.upload.excludehidden;

            if (dependency.cartridges.length > 0) {
                // Cartridges given? Add each cartridge folder + globbing
                grunt.log.writeln('    - Copying configured cartridges: ');
            } else {
                // Cartridges NOT given? Copy whole directory.
                grunt.log.writeln('    - Copying all cartridges in repository: ');

                const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(p + '/' + f).isDirectory());
                try {
                    dependency.cartridges = dirs(dependency.cwd);
                } catch (e) {
                    grunt.log.writeln('      - No cartridges found');
                }
            }

            var copyOptions = { files: [] };

            dependency.cartridges.forEach(function (cartridgeName) {
                grunt.log.write('      - ' + cartridgeName + ' ');
                var cwd = dependency.cwd + '/' + cartridgeName;

                if (!grunt.file.isDir(cwd)) {
                    // Cartridge directory not found? Check for ignoreEmpty and stop/skip folder
                    if (dependency.source.ignoreEmpty && dependency.source.ignoreEmpty == true) {
                        grunt.log.warn('Could not find cartridge, skipping');
                        return;
                    }
                    grunt.fail.warn('Could not find cartridge!');
                } else {
                    grunt.log.ok();
                }

                var cartridgeOptions = {
                    cwd: cwd,
                    src: dependency.source.glob,
                    dest: grunt.config('dw_properties').folders.code + cartridgeName,
                    expand: true,
                    nonull: nonull,
                    dot: dot
                };

                copyOptions.files.push(cartridgeOptions);
            });

            grunt.config('copy.' + dependency.id, copyOptions);
            grunt.task.run('copy:' + dependency.id);

            // Check whether site import (initialization/demodata) is triggered
            if (!settings.siteImport.enabled) {
                grunt.log.writeln('    - Site import disabled in settings.');
            } else if (dependency.siteImport && dependency.siteImport.enabled !== 'true') {
                grunt.log.writeln('    - Site import disabled for this repository.');
            } else {
                grunt.log.writeln('    - Copying Site import data.');
                configureSiteImport(grunt, dependency, settings);
            }
        });
    });
};
