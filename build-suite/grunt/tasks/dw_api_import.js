'use strict';

const OcapiUtils = require('../lib/util/dw_api_utils');

// Generic Settings, might be moved to options if necessary
const POLL_INTERVAL_SECONDS = 10;
const MAX_RETRY = 2;


/**
 * Grunt module calling SFCC Code Activation via Data API
 *
 * @param {Grunt} grunt
 */
module.exports = function (grunt) {
    let utils;
    let options;
    let done;
    let jobId;
    let jobExecutionId;
    let retry;

    /**
     * OCAPI Site Import Task Definition
     */
    grunt.registerMultiTask('dw_api_import', 'Triggers Site Import via OCAPI', function () {
        done = this.async();
        options = this.options();
        utils = new OcapiUtils(grunt);

        utils.auth(startImport);
    });


    /**
     * Calls OCAPI to start the import job
     * Handles first response to see if job was started successfully
     *
     * @param {String} token
     */
    let startImport = function startImport(token) {
        let instanceApi = require('sfcc-ci').instance;
        retry = MAX_RETRY;

        grunt.log.writeln(' -- Starting import Job for ' + options.fileName);

        instanceApi.import(options.baseUrl, options.fileName, token, function (result, error) {
            grunt.log.verbose.writeln('Got Response: ' + JSON.stringify(result, null, 2));
            grunt.log.verbose.writeln('Got Error: ' + JSON.stringify(error, null, 2));

            if (!error && typeof (result) !== 'undefined' && result.id) {
                jobId = result.job_id;
                jobExecutionId = result.id;
            } else if (typeof (result) !== 'undefined' && result.fault) {
                grunt.fail.fatal('Could not start import job! HTTP ' + error.status + ': ' + result.fault.message);
            } else {
                grunt.fail.fatal('Could not start import job! ' + error);
            }

            grunt.log.writeln('  * Job started. Execution ID: ' + jobExecutionId);
            pollJobStatus();
        });
    };


    /**
     * Checks Job Status response, either times next poll or ends up in success/error
     *
     * @param {object} result
     * @param {object} error
     */
    let handleJobStatusResponse = function handleJobStatusResponse(result, error) {
        grunt.log.verbose.writeln('Got Result: ' + JSON.stringify(result, null, 2));
        grunt.log.verbose.writeln('Got Error: ' + JSON.stringify(error, null, 2));

        if (error) {
            let fault = typeof (result) !== 'undefined' ? result.fault : undefined;

            if (fault) {
                if (fault.type == 'InvalidAccessTokenException') {
                    // Token invalid or expired
                    grunt.log.writeln('  * Token invalid. Renewing...');

                    // Check for max retries so we're not getting stuck in an infinite loop
                    if (retry === 0) {
                        grunt.fail.fatal('Unable to retrieve valid token after ' + MAX_RETRY + ' retries.');
                    }

                    // Update retries counter
                    retry--;
                    pollJobStatus(true);

                    return;
                }

                // Common errors have common handling
                grunt.fail.fatal('Error monitoring job: ' + result.fault.message);
            }
        }

        // Error without faults and empty response is handled here
        if (error || !result) {
            grunt.fail.fatal('Error monitoring Job: ' + error);
        }

        if (result.status === 'RUNNING') {
            grunt.log.writeln('  * Job still running...');
            setTimeout(pollJobStatus, POLL_INTERVAL_SECONDS * 1000);
            return;
        } else if (result.status === 'ERROR') {
            grunt.fail.fatal('Job finished with status "error". Please check job history in Business Manager.');
        }

        grunt.log.ok('Job finished! Status: ' + result.execution_status);
        done();
    };


    /**
     * Poll for current Job status.
     *
     * @param {boolean} renew If true, auth module will obtain a new token
     */
    let pollJobStatus = function pollJobStatus(renew) {
        utils.auth(function (token) {
            let jobApi = require('sfcc-ci').job;
            jobApi.status(options.baseUrl, jobId, jobExecutionId, token, handleJobStatusResponse);
        }, renew);
    };
};
