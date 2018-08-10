'use strict';

module.exports = function (grunt) {
    grunt.registerTask('dw_optimize', 'Static resource optimization', function () {
        var jsOptimizationEnabled = grunt.config('settings').optimize.js;
        var cssOptimizationEnabled = grunt.config('settings').optimize.css;

        // JS Optimization enabled?
        if (jsOptimizationEnabled && jsOptimizationEnabled === 'true') {
            grunt.log.ok('Javascript optimization enabled. Running uglify.');
            grunt.task.run('uglify');
        } else {
            grunt.log.warn('Javascript optimization disabled - skipping.');
        }

        // CSS Optimization enabled?
        if (cssOptimizationEnabled && cssOptimizationEnabled === 'true') {
            grunt.log.ok('CSS optimization enabled. Running cssmin.');
            grunt.task.run('cssmin');
        } else {
            grunt.log.warn('CSS optimization disabled - skipping.');
        }
    });
};
