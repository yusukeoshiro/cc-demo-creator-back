'use strict';

const OcapiUtils = require('../lib/util/dw_api_utils');

/**
 * Activate code version.
 *
 * Use either OCAPI or Business Manager scraping, depending on the settings.
 */
module.exports = function (grunt) {
    grunt.registerMultiTask('dw_import', 'Trigger, monitor and evaluate Site Import Jobs on SFCC.', function () {
        let options = this.options();

        let utils = new OcapiUtils(grunt);

        // Trigger tasks based on previous decision
        if (utils.ocapiEnabled()) {
            grunt.log.ok('Running OCAPI Site Import');
            grunt.task.run(options.ocapi_tasks);
        } else {
            grunt.log.ok('Running Business Manager Site Import');
            grunt.task.run(options.bm_tasks);
        }
    });
};
