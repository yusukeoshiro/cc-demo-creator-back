/**
 *  Demandware Build Suite - part of the Community Suite
 *
 *  @Contributors: Holger Nestmann, Danny Gehl, Jason Moody, Danny Domhardt, Daniel Mersiowsky
 **/
module.exports = function (grunt) {
    var path = require('path');

    // Load all Demandware specific plugins (not distributed by npm)
    grunt.loadTasks('grunt/tasks');

    // Display execution time of grunt tasks
    require('time-grunt')(grunt);

    // Load all grunt configs, look in the config directory to modify configuration for any specific task
    require('load-grunt-config')(grunt, {
        configPath: path.join(process.cwd(), 'grunt/config')
    });

    grunt.loadNpmTasks('grunt-npm-command');

    grunt.log.writeln();
    grunt.log.writeln('********************** Salesforce Commerce Cloud Build Suite **********************');
    grunt.log.writeln('Run "grunt help" to print a list of available taks.');
    grunt.log.writeln();
    grunt.log.writeln(' -- Initializing...');

    // Load and parse configuration file(s)
    require('./grunt/lib/config/loader')(grunt);

    // Map legacy config to current format
    require('./grunt/lib/config/mapper')(grunt);

    // Normalize config (default values, correct format)
    require('./grunt/lib/config/normalizer')(grunt);

    // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs where hostname / IP do not match
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    // Output
    grunt.log.write(' -- Initialization '); grunt.log.ok();
    grunt.log.writeln();
    grunt.log.writeln(' -- Project: ' + grunt.config('settings').project.name);
    grunt.log.writeln(' -- Version: ' + grunt.config('dw_properties').version.name);
    grunt.log.writeln(' -- Target:  ' + grunt.config('environment').server);
    grunt.log.writeln();
};
