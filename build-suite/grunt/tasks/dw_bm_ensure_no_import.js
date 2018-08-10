'use strict';

var request = require('../lib/util/bm_request'),
    parseBody = require('../lib/util/dw_bm_import').parseBody;

/**
 * Waits for an import job to finish.
 **/
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_bm_ensure_no_import', 'Wait for import to finish', function () {
        var options = this.options(),
            done = this.async(),
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
         * Handles the response of the request.
         * If the import job is still running, it keeps on retrying.
         */
        function handleResponse(error, body) {
            try {
                if (error) {
                    throw 'Error getting the import-export page: ' + error;
                }

                var job = parseBody(body, options);
                if (job && job.isRunning) {
                    throw 'Import already running! Duration: ' + job.duration;
                } else {
                    done();
                }
            } catch (e) {
                grunt.fail.fatal(e);
                done(false);
            }
        }

        performRequest();
    });
};
