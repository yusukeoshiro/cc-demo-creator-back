'use strict';

module.exports = {
    default: {
        src: '<%= dw_properties.folders.code %>/*/cartridge/**/*.isml',
        options: {
            optimize_js: '<%= settings.optimize.js %>',
            optimize_css: '<%= settings.optimize.css %>',
            merge_enabled: '<%= settings.optimize.concatenate %>'
        }
    }
};
