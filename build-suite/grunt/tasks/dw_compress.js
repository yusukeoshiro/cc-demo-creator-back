let fs = require('fs');
let Zip = require('../lib/util/zip');

// Maximum zip file size (in MBytes)
const MAXSIZE = 100;


/**
 * Compress a folder, limit zip file size to 100MBytes by creating chunks
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_compress', 'Compress Code into Zip files.', function () {
        let options = this.options();
        let files = grunt.file.expand(options.src);

        if (files.length === 0) {
            grunt.fail.warn('Could not find any files to compress!');
        }

        let zipCount = 1;
        let fileCount = 0;
        let done = this.async();

        let zipFile = (options.targetFolder ? options.targetFolder : options.cwd) + options.target;
        let zipOutput = new Zip(zipFile, done);
        let promise = Promise.resolve(0);

        grunt.log.writeln('  * Creating archive: ', zipOutput.getVolumeName());

        // Iterate through source files
        files.forEach(function (file) {
            fileCount++;

            // Chain promise with next file in the loop
            promise = promise.then(function (currentSize) {
                if (isZipFileSizeExceeded(file, currentSize)) {
                    zipOutput.createNewVolume();
                    grunt.log.writeln('  * Creating archive: ', zipOutput.getVolumeName());
                    zipCount++;
                }

                let targetPath = options.target + '/' + file.substring(options.cwd.length, file.length);

                grunt.log.verbose.writeln('Adding file', file, 'to', targetPath);
                return zipOutput.addFile(file, targetPath);
            });
        });

        // Final promise for closing ZIP stream
        promise = promise.then(function () {
            zipOutput.close();

            if (zipCount > 1) {
                grunt.log.ok('Successfully zipped', fileCount, 'files into', zipCount, 'volumes.');
            } else {
                grunt.log.ok('Successfully zipped', fileCount, 'files.');
            }
        });

        // attach error handler on promise
        promise = promise.catch(function (err) {
            grunt.fail.fatal('Error during zip process:', err);
        });
    });
};


/**
 * Checks if the current file will make the Zip file exceed the max. volume size
 *
 * @param {String} file Local filename to be added to ZIP
 * @param {Number} currentSize The current Zip file size
 */
function isZipFileSizeExceeded(file, currentSize) {
    var stats = fs.statSync(file);

    // check if current ZIP size plus next file size exceed maximum size
    return (stats.size + currentSize > MAXSIZE * 1000 * 1000);
}
