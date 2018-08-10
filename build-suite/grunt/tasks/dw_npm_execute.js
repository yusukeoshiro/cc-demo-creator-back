'use strict';

function runNpmTasks(dependency, grunt) {
    let cwd = dependency.cwd;

    if (dependency.npm.cwd) {
        cwd += '/' + dependency.npm.cwd;
    }

    if (typeof dependency.npm.install == 'undefined' || dependency.npm.install.toString() != 'false') {
        grunt.log.writeln('   - NPM install enabled.');

        var taskConfig = {
            options: {
                cwd: cwd,
                cmd: 'install'
            }
        };

        grunt.config('npm-command.' + dependency.id + '__install', taskConfig);
        grunt.task.run('npm-command:' + dependency.id + '__install');
    } else {
        grunt.log.writeln('   - NPM install disabled.');
    }


    dependency.npm.scripts.forEach(function (task) {
        var taskId = dependency.id + '__' + task;
        taskId = taskId.replace(/\.|\:/g, '_');

        var taskConfig = {
            options: {
                cwd: cwd,
                cmd: 'run',
                args: task
            }
        };

        grunt.log.writeln('   - Running: ' + task);

        grunt.config('npm-command.' + taskId, taskConfig);
        grunt.task.run('npm-command:' + taskId);
    });
}

module.exports = function (grunt) {
    grunt.registerTask('dw_npm_execute', 'Executes npm scripts', function () {
        let dependencies = grunt.config('dependencies');

        dependencies.forEach(function (dependency) {
            if (dependency.npm && dependency.npm.scripts && dependency.npm.scripts.length > 0) {
                grunt.log.writeln(' * Found NPM configuration for ' + dependency.id);

                runNpmTasks(dependency, grunt);
            } else {
                grunt.log.writeln(' * No NPM configuration found for ' + dependency.id);
            }
        });
    });
};

