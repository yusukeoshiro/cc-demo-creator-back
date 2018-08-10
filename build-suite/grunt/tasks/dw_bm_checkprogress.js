'use strict';

var request = require('../lib/util/bm_request');
var parseBody = require('../lib/util/dw_bm_import').parseBody;

/**
 * Waits for an import job to finish.
 **/
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_bm_checkprogress', 'Wait for import to finish', function () {
        var options = this.options({ interval: 5000 });
        var done = this.async();
        var url;

        if (!options.path) {
            throw 'No path defined for this process';
        }

        url = options.server + options.path;

        /**
         * Initiates the request to fetch the Site Import Export page.
         * Log in to the BM needs to have happened previously.
         */
        function performRequest() {
            request({
                url: url,
                jar: true
            }, function (error, resp, body) {
                handleResponse(error, body);
            });
        }

        /**
         * @private
         */
        function isTTY() {
            return process && process.stdout && process.stdout.isTTY;
        }

        /**
         * @private
         */
        function printProgressMessage(message) {
            if (isTTY()) {
                process.stdout.cursorTo(0);
                process.stdout.write(message);
                process.stdout.clearLine(1);
            } else {
                grunt.log.writeln(message);
            }
        }

        /**
         * @private
         */
        function clearProgressMessage() {
            if (isTTY()) {
                process.stdout.write('\n');
            }
        }

        /**
         * Handles the response of the request.
         * If the import job is still running, it keeps on retrying.
         */
        function handleResponse(error, body) {
            try {
                if (error) {
                    throw 'Error getting the import-export page: ' + error;
                }

                var record = parseBody(body, options);

                if (!record) {
                    throw 'Could not find import job';
                }

                if (record.isRunning) {
                    printProgressMessage('Job still running. Execution time: ' + record.duration);
                    setTimeout(function () {
                        performRequest(grunt, url, done);
                    }, options.interval);
                } else if (record.isError) {
                    throw 'Import failed! Login to BM for more details.';
                } else if (record.isFinished) {
                    clearProgressMessage();
                    grunt.log.writeln('Finished. ' + (record.dataErrors || 'No') +
                ' data errors. Duration: ' + record.duration);
                    done();
                } else {
                    throw 'Unexpected state!';
                }
            } catch (e) {
                clearProgressMessage();
                grunt.fail.fatal(e);
                done(false);
            }
        }

        performRequest();
    });
};
