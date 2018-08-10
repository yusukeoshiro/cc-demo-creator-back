'use strict';

/**
 * @module
 * Module containing functions for creating site imports
 */
module.exports = (function (grunt) {
    /**
     * Temporary "target" path where files are placed and processed.
     * This folder will be zipped and uploaded.
     */
    function getBasePath() {
        var targetFolderName = grunt.config.get('settings').siteImport.filenames.init;

        if (!targetFolderName || targetFolderName.length === 0) {
            grunt.fail.warn('Missing archive name for site import (settings.SiteImport.filenames.init).');
        }

        return grunt.config('dw_properties').folders.site + targetFolderName;
    }

    /**
     * The source path for the site import
     * This folder was placed in "output" directory by build/dw_copy task.
     */
    function getImportPath() {
        var importPath = grunt.config('dw_properties').folders.site;

        if (!importPath) {
            grunt.fail.fatal('Import path is not set');
        }

        if (!grunt.file.isDir(importPath)) {
            grunt.file.mkdir(importPath);
        }

        return importPath;
    }

    /**
     * @private
     *
     * @param {String} dir The Source Directory to fetch from
     * @param {Array} glob List of additional Globbing rules
     */
    function copyConfiguration(dir, glob) {
        var src = [dir + '/**/*', '!' + dir + '/*.zip'];
        var dest = getBasePath();

        // Add the passed Globbing rules
        if (glob) {
            src = src.concat(glob);
        }

        grunt.log.verbose.writeln('  - Target: ' + dest);

        // Check for Site filter
        var filter = grunt.config.get('settings').siteImport.sites;

        // Apply site filter by globbing for given sites in site import preparation process
        // only selected sites will be copied
        if (filter && typeof filter.map === 'function') {
            src.push('!' + dir + '/sites/**/*');
            src = src.concat(filter.map(function (site) {
                return dir + '/sites/' + site + '/**/*';
            }));

            grunt.log.writeln('  - Found site filter');
        }

        grunt.log.verbose.writeln('  - Using globbing pattern: \n' + JSON.stringify(src, null, 2));

        grunt.file.expand(src).forEach(function (file) {
            if (grunt.file.isFile(file)) {
                var f = file.replace(dir, '');
                grunt.file.copy(file, dest + f);
            }
        });
    }

    /**
     * retrieves files based on replacement file values
     *
     * @param {Object} inputFiles - the replacement object
     */
    function fetchFiles(inputFiles) {
        // use globbing to modify all files matching given pattern in given rule.
        var files = {};

        inputFiles.forEach(function (file) {
            var allFiles = grunt.file.expand(getBasePath() + '/' + file);
            grunt.log.verbose.writeln('   ...globbed ' + file + ' to: ', allFiles);

            allFiles.forEach(function (f) {
                files[f] = f;
            });
        });

        return files;
    }

    /**
     * update data in xml and text files
     *
     * @param {Object} replacements - object containing xml and text replacements
     */
    function updateData(replacements) {
        if (replacements.xmlReplacements) {
            updateXML(replacements.xmlReplacements);
        }

        if (replacements.textReplacements) {
            updateText(replacements.textReplacements);
        }
    }

    /**
     * Execute XML replacements
     *
     * Configures an xmlpoke task to be run after the current executing task.
     */
    function updateXML(replacements) {
        if (typeof replacements === 'undefined' && replacements.length === 0) {
            return;
        }

        var filesFound = false;
        grunt.log.verbose.writeln('  - Reading XML replacements...');

        replacements.forEach(function (replacement, index) {
            var files = null;

            if (replacement.files) {
                files = fetchFiles(replacement.files);
            }

            if (!files) {
                return;
            }

            // Write proper verbose output
            var type = replacement.valueType ? '" (type: "' + replacement.valueType + '")' : '';
            var logMsg = '...setting "' + replacement.xpath + '" to "' + replacement.value;
            grunt.log.verbose.writeln('   ' + logMsg + type, files);

            // Setup xmlpoke configuration based on the given rules array.
            grunt.config('xmlpoke.' + (index + 1), {
                files: files,
                options: replacement.options
            });

            filesFound = true;
        });

        if (filesFound) {
            // Run xmlpoke task
            grunt.task.run('xmlpoke');
            grunt.log.ok('XML replacement tasks created.');
        } else {
            grunt.log.warn('No target files found for XML replacements. Please check file pattern.');
        }
    }

    /**
     * Execute text replacements
     *
     * @param {Array} replacements - Array containing text replacement data
     */
    function updateText(replacements) {
        grunt.log.verbose.writeln(' -- Reading Text replacements...');

        replacements.forEach(function (replacement, index) {
            var files = fetchFiles(replacement.files);
            var srcFiles = [];

            for (var i in files) {
                srcFiles.push(files[i]);
            }

            grunt.log.verbose.writeln('   ...applying replacements to', srcFiles);

            grunt.config('replace.' + (index + 1), {
                src: srcFiles,
                overwrite: true,
                replacements: replacement.options.replacements
            });

            // run the replacements
            grunt.task.run('replace');
            grunt.log.ok('Text replacement tasks created.');
        });
    }

    /**
     * Copy generic configuration into site-import output folder.
     */
    function copySiteInitData() {
        var sourcePath = getImportPath() + 'site_init';

        grunt.log.verbose.writeln('  - Source: ' + sourcePath);
        copyConfiguration(sourcePath);
    }

    /**
     * Copy demo site data to site_import folder
     * @public
     */
    function copySiteDemoData() {
        var sourcePath = getImportPath() + 'site_demo';

        grunt.log.verbose.writeln('  - Source: ' + sourcePath);
        copyConfiguration(sourcePath);
    }

    /**
     * Copy Environment-based Site Import files
     * @public
     */
    function copyEnvOverrides(targetEnv) {
        var sourcePath = getImportPath() + 'config/' + targetEnv;

        grunt.log.verbose.writeln('  - Source: ' + sourcePath);
        copyConfiguration(sourcePath, ['!' + sourcePath + '/config.json']);
    }

    /**
     * Checks if the output directory actually contains files.
     */
    function checkForFiles() {
        var size = 0;

        if (!grunt.file.isDir(getBasePath())) {
            return false;
        }

        // Walk through directory and count files.
        grunt.file.recurse(getBasePath(), function (file) {
            if (grunt.file.isFile(file)) {
                size++;
            }
        });

        grunt.log.verbose.writeln('Found ' + size + ' files for Site import.');

        return size > 0;
    }

    /**
     * Clear given folder in output directory, by default it will clear the site_import folder.
     * @public
     */
    function cleanup() {
        var directory = getBasePath();

        if (grunt.file.isDir(directory)) {
            grunt.log.verbose.writeln('Cleanup output folder ' + directory);
            grunt.file.delete(directory);
        }
    }

    return {
        copySiteDemoData: copySiteDemoData,
        copySiteInitData: copySiteInitData,
        cleanup: cleanup,
        checkForFiles: checkForFiles,
        updateData: updateData,
        copyEnvOverrides: copyEnvOverrides
    };
});
