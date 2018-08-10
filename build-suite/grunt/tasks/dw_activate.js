'use strict';

const OcapiUtils = require('../lib/util/dw_api_utils');

/**
 * Activate code version.
 *
 * Use either OCAPI or Business Manager scraping, depending on the settings.
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_activate', 'Activate code version', function () {
        var ocapiUtils = new OcapiUtils(grunt);

        if (ocapiUtils.ocapiEnabled()) {
            grunt.log.ok('Running OCAPI Code Activation');
            grunt.task.run(['dw_api_activate_code']);
        } else {
            grunt.log.ok('Running Business Manager Code Activation');
            grunt.task.run(['dw_bm_login', 'dw_bm_activate_code']);
        }
    });
};
