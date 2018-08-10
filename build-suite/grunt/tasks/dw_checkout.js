'use strict';

/**
 * Check whether clone or pull is appropriate
 *
 * @param grunt
 * @param dependency
 */
function handleGitRepository(grunt, dependency) {
    var checkoutpath = grunt.config('dw_properties').folders.repos + dependency.id;

    if (grunt.file.exists(checkoutpath)) {
        gitPull(grunt, dependency, checkoutpath);
    } else {
        gitClone(grunt, dependency, checkoutpath);
    }
}

/**
 * Create Git Pull tasks and execute it
 *
 * Contributor: robeson
 *
 * @param grunt
 * @param dependency
 * @param checkoutpath
 */
function gitPull(grunt, dependency, checkoutpath) {
    grunt.config('gitreset.' + dependency.id, {
        options: {
            cwd: checkoutpath,
            mode: 'hard'
        }
    });
    grunt.config('gitfetch.' + dependency.id, {
        options: {
            cwd: checkoutpath,
            all: true
        }
    });
    grunt.config('gitcheckout.' + dependency.id, {
        options: {
            cwd: checkoutpath,
            branch: (dependency.repository.branch || 'master')
        }
    });
    grunt.config('gitpull.' + dependency.id, {
        options: {
            cwd: checkoutpath,
            branch: (dependency.repository.branch || 'master')
        }
    });

    // Robust update: reset local changes, fetch branch info, checkout branch and pull changes.
    grunt.task.run('gitreset:' + dependency.id);
    grunt.task.run('gitfetch:' + dependency.id);
    grunt.task.run('gitcheckout:' + dependency.id);
    grunt.task.run('gitpull:' + dependency.id);
}

/**
 * Create Git Clone task and execute it
 *
 * @param grunt
 * @param dependency
 * @param checkoutpath
 */
function gitClone(grunt, dependency, checkoutpath) {
    var url = dependency.repository.url;

    // Possibilty to provide username and password in config file
    if (dependency.repository.username || dependency.repository.password) {
        if (url.indexOf('https://') !== 0) {
            var errorMsg = 'Providing username and password for git repositories only works for HTTPS urls.';
            grunt.fail.warn(errorMsg);
        }

        var encodedUser = encodeURIComponent(dependency.repository.username);
        var encodedPass = encodeURIComponent(dependency.repository.password);

        // New URL: https://[user]:[password]@url
        url = 'https://' + encodedUser + ':' + encodedPass + '@' + url.substring(8);
    }

    grunt.config('gitclone.' + dependency.id, {
        options: {
            repository: url,
            branch: (dependency.repository.branch || 'master'),
            directory: checkoutpath
        }
    });

    grunt.task.run('gitclone:' + dependency.id);
}

/**
 * Create SVN checkout/update task and execute it
 *
 * @param grunt
 * @param dependency
 */
function handleSvnRepository(grunt, dependency) {
    var cwd = grunt.config('dw_properties').folders.repos + dependency.id;

    // Basic options for repository
    var options = {
        options: {
            repository: dependency.repository.url + '/',
            path: cwd + '/',
            username: dependency.repository.username,
            password: dependency.repository.password,
            svnOptions: {
                'non-interactive': '',
                quiet: '',
                'trust-server-cert': ''
            }
        } };

    // Folder mapping, e.g. map "trunk" to exports/[projectName]/.
    options[dependency.id] = {
        map: {
            './': (dependency.repository.branch || 'trunk')
        }
    };

    grunt.config('svn_fetch', options);
    grunt.task.run('svn_fetch:' + dependency.id);
}

/**
 * Create and execute VCS checkout/update tasks according to depenency setup
 */
module.exports = function (grunt) {
    var taskTitle = 'Prepare and execute VCS checkout tasks according to dependency setup.';

    grunt.registerMultiTask('dw_checkout', taskTitle, function () {
        var dependencies = grunt.config('dependencies');

        dependencies.forEach(function (dependency) {
            grunt.log.writeln('');
            grunt.log.writeln('   ** Repository:  ' + dependency.repository.url);

            if (dependency.repository.branch) {
                grunt.log.writeln('    - Branch: ' + dependency.repository.branch);
            }

            grunt.log.writeln('    - Source path: ' + dependency.cwd);

            switch (dependency.repository.type.toLowerCase()) {
            case 'file':
                break;

            case 'svn':
                handleSvnRepository(grunt, dependency);
                break;

            case 'git':
                handleGitRepository(grunt, dependency);
                break;

            default:
                grunt.fail.warn('Unknown repository type for "' + dependency.id + '". Please configure.');
            }
        });
    });
};
