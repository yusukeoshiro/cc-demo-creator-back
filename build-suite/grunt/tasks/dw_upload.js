'use strict';

/**
 *  Uploads files to Demandware webdav
 *
 *  Based on Webdav Deploy (https://github.com/abovethewater/grunt-webdav-deploy)
 */

var fs = require('fs');
var http = require('https');
var async = require('async');
var path = require('path');

var MAX_RETRIES = 5;

module.exports = function (grunt) {
    /**
   * Triggers deletion of a given zip file on WebDAV Server.
   */
    function deleteArchive(httpOptions, grunt, data, callback, retries) {
        httpOptions.method = 'DELETE';

        var deleteRequest = http.request(httpOptions, function (res) {
            var success = false;

            if (res.statusCode === 204) {
                grunt.log.ok();
                success = true;
            } else if (res.statusCode === 404) {
                grunt.log.ok('none found.');
                success = true;
            } else if (res.statusCode === 401) {
                grunt.fail.fatal('Authentication failed. Please check credentials.');
                callback();
                return;
            } else if (res.statusCode === 405) {
                grunt.log.error('Remote server does not support webdav!');
            } else {
                grunt.log.error('Unknown error occurred (delete): ' + res.statusCode + ' (' + res.statusMessage + ')!');
            }

            if (success) {
                // Proceed to upload
                uploadArchive(httpOptions, grunt, data, callback, MAX_RETRIES);
            } else if (--retries) {
                // Retry
                grunt.log.write('   - Retrying: ');
                deleteArchive(httpOptions, grunt, data, callback, retries--);
            } else {
                grunt.fail.warn('Maximum retry count reached. Canceling.');
                callback();
            }
        });

        deleteRequest.on('error', function (e) {
            grunt.log.writeln(e.stack);

            // We only want to retry a couple of times on errors.
            if (--retries) {
                grunt.log.warn('  - Error deleting file: ' + e.message);
                grunt.log.writeln('...Retrying.');
                grunt.log.writeln();
                deleteArchive(httpOptions, grunt, data, callback, retries--);
            } else {
                grunt.fail.warn('No success after 5 retries. Could not complete Request.');
                callback();
            }
        });

        grunt.log.write('   * Deleting existing file... ');
        deleteRequest.end();
    }

    /**
   * Triggers upload of a given server to a WebDAV directory.
   */
    function uploadArchive(httpOptions, grunt, data, callback, retries) {
        httpOptions.method = 'PUT';

        var putRequest = http.request(httpOptions, function (res) {
            var success = false;

            if (res.statusCode === 201 || res.statusCode === 200) {
                grunt.log.ok();
                success = true;
            } else if (res.statusCode === 204) {
                grunt.log.error('Remote file exists!');
            } else if (res.statusCode === 401) {
                grunt.fail.fatal('Authentication failed. Please check credentials.');
                callback();
                return;
            } else if (res.statusCode === 405) {
                grunt.log.error('Remote server does not support webdav!');
            } else {
                grunt.log.error('Unknown error occurred: ' + res.statusCode + ' (' + res.statusMessage + ')!');
            }

            if (success) {
                // Upload Successful!
                callback();
            } else if (--retries) {
                // Retry
                grunt.log.write('   - Retrying: ');
                uploadArchive(httpOptions, grunt, data, callback, retries--);
            } else {
                grunt.fail.warn('Maximum retry count reached. Canceling.');
                callback();
            }
        });

        putRequest.on('error', function (e) {
            grunt.log.writeln(e.stack);

            // We only want to retry a couple of times on errors.
            if (--retries) {
                grunt.log.writeln('   - Error uploading file: ' + e.message);
                grunt.log.writeln('...Retrying.');
                grunt.log.writeln();
                uploadArchive(httpOptions, grunt, data, callback, retries--);
            } else {
                grunt.fail.warn('Maximum retry count reached. Canceling.');
                callback();
            }
        });

        grunt.log.write('   * uploading... ');
        putRequest.end(data, 'binary');
    }

    /**
   * @param {object} options
   * @returns {boolean}
   */
    function isTwoFactorEnabled(options) {
        if (!options.two_factor || !options.two_factor.enabled) {
            return false;
        }

        return options.two_factor.enabled.toString().toLowerCase() === 'true';
    }

    /**
   * Set options for two factor auth if enabled
   */
    function initTwoFactorOptions(httpOptions, options) {
        if (!isTwoFactorEnabled(options)) {
            return;
        }

        // Set proper options
        httpOptions.pfx = fs.readFileSync(options.two_factor.cert);
        httpOptions.passphrase = options.two_factor.password;
        httpOptions.secureProtocol = 'TLSv1_1_method';
    }

    function getAuth(grunt) {
        var user = grunt.config('environment.username');
        var pass = grunt.config('environment.password');

        if (typeof user !== 'string' || typeof pass !== 'string') {
            grunt.fail.fatal('Incomplete credentials (user/password)');
        }

        return user + ':' + pass;
    }

    function createUnzipTask(grunt, options, fileName) {
        var httpOptions = {
            auth: {
                user: grunt.config('environment.username'),
                pass: grunt.config('environment.password')
            },
            uri: 'https://' + options.url + options.release_path + fileName,
            form: {
                method: 'UNZIP'
            }
        };

        initTwoFactorOptions(httpOptions, options);

        var unzipOptions = {
            options: httpOptions
        };

        var unzipTaskName = 'unzipUpload_' + fileName.split('.zip')[0].replace(/\./g, '_');
        grunt.config('http.' + unzipTaskName, unzipOptions);
        grunt.task.run('http:' + unzipTaskName);
    }

    function createCleanupTask(grunt, options, fileName) {
        var httpOptions = {
            auth: {
                user: grunt.config('environment.username'),
                pass: grunt.config('environment.password')
            },
            uri: 'https://' + options.url + options.release_path + fileName,
            form: {
                method: 'DELETE'
            }
        };

        initTwoFactorOptions(httpOptions, options);

        var unzipOptions = {
            options: httpOptions
        };

        var unzipTaskName = 'cleanupUpload_' + fileName.split('.zip')[0].replace(/\./g, '_');
        grunt.config('http.' + unzipTaskName, unzipOptions);
        grunt.task.run('http:' + unzipTaskName);
    }

    grunt.registerMultiTask('dw_upload', 'Upload files via WebDAV', function () {
        let options = this.options();
        let done = this.async();
        let fileCounter = 0;

        if (isTwoFactorEnabled(options)) {
            options.url = options.two_factor.url;
        }

        // Check for source files, complain if there are none
        if (this.filesSrc.length === 0) {
            grunt.fail.fatal("Could not find Source Files. Please run 'grunt build' before uploading.");
        }

        let authString = getAuth(grunt);

        // Iterate over all Zip files in code directory, trigger upload + unzip + cleanup
        async.eachSeries(this.filesSrc, function (filePath, callback) {
            fileCounter++;

            var data = fs.readFileSync(filePath);
            var fileName = filePath.split(path.sep).reverse()[0];

            let httpOptions = {
                hostname: options.url,
                port: 443,
                path: options.release_path + fileName,
                auth: authString
            };

            initTwoFactorOptions(httpOptions, options);

            // Trigger Requests
            grunt.log.writeln(' -- Starting file upload for ' + fileName);

            // Zip File Volumes have to be extrated for each kind of import
            let isZipVolume = fileCounter > 1 && fileName.match(/.+_\d\d\d\.zip/);

            // Unzip and Cleanup (only for code uploads)
            if (options.mode === 'code' || isZipVolume) {
                if (isZipVolume) {
                    grunt.log.writeln('   * Zip file volume detected.');
                }

                // Append Unzip Task
                createUnzipTask(grunt, options, fileName);
                grunt.log.writeln('   * Triggering unzip');

                // Append Cleanup Task if configured
                if (typeof options.cleanup === 'undefined' || options.cleanup.toString() !== 'false') {
                    createCleanupTask(grunt, options, fileName);
                    grunt.log.writeln('   * Triggering delete');
                } else {
                    grunt.log.writeln('   * Delete disabled. Will keep Zip file on server.');
                }
            }

            deleteArchive(httpOptions, grunt, data, callback, MAX_RETRIES);
        },

        function () {
            done();
        });
    });
};
