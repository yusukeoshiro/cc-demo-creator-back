'use strict';

module.exports = function (grunt) {
    let env = grunt.config('environment');
    let previousToken;


    /**
     * Checks if OCAPI is enabled through two mechanisms:
     *
     *  - OCAPI Credentials (Client ID, Client Secret) must have been provided
     *  - The OCAPI Module ('sfcc-ci') must be installed and available
     */
    this.ocapiEnabled = function ocapiEnabled() {
        if (env.client_id && env.client_secret) {
            grunt.log.writeln(' -- Found OCAPI credentials.');

            try {
                // Try to load the CI module. If it's not there, use BM.
                require('sfcc-ci');
                grunt.log.writeln(' -- OCAPI Module (sfcc-ci) loaded successfully.');
                return true;
            } catch (e) {
                grunt.log.writeln(' -- Could not load SFCC-CI module! Falling back to Business Manager.');
            }

            return false;
        }
    };


    /**
     * Authenticates agains OCAPI, stores Token for reuse.
     * IF token exists, it is reused immediately
     *
     * @TODO Check and react on timeout
     *
     * @param {callable} callback
     *
     */
    this.auth = function auth(callback, renew) {
        let env = grunt.config('environment');
        let authApi = require('sfcc-ci').auth;

        if (previousToken && !renew) {
            callback(previousToken);
            return;
        }

        authApi.auth(env.client_id, env.client_secret, function (token) {
            if (!token) {
                grunt.fail.fatal('Authorization failed');
            }

            previousToken = token;

            grunt.log.writeln(' -- Authorization successful');
            grunt.verbose.writeln('Received token: ' + token);

            callback(token);
        });
    };
};
