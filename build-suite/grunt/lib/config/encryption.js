'use strict';

/**
 * En-/Decryption module.
 * If enabled, ensures that only encrypted passwords are stored to config file.
 */
module.exports = function Encryption(grunt) {
    var ENCRYPTION_MARKER = 't8kdrXdL61E_';
    var ENCRYPTION_PASSPHRASE = 'gBqZACrbEMdiICjSerRWzFeK';

    var crypto = require('crypto');

    /**
     * Returns whether a given string is encrypted
     *
     * @param {String} password
     * @returns {boolean}
     */
    let isEncrypted = function isEncrypted(password) {
        return (password.indexOf(ENCRYPTION_MARKER) === 0);
    };

    /**
     * Collect all passwords that might need to be encrypted
     *
     * @returns {Array}
     */
    let collectPasswords = function collectPasswords() {
        let passwords = [];

        let environment = grunt.config('environment');

        // WebDAV / Business Manager password
        if (environment.password) {
            passwords.push(environment.password);
        }

        // Two factor secret
        if (environment.two_factor && environment.two_factor.password) {
            passwords.push(environment.two_factor.password);
        }

        // OCAPI client secret
        if (environment.client_secret) {
            passwords.push(environment.client_secret);
        }

        let dependencies = grunt.config.get('dependencies');

        // VCS passwords
        dependencies.forEach(function (dependency) {
            if (dependency.repository && dependency.repository.password) {
                passwords.push(dependency.repository.password);
            }
        });

        return passwords;
    };


    /**
     * Replaces all passwords in config file with their encrypted counterparts.
     * Does consider lines with passwords only.
     *
     * @param {Object} encryptedPasswords
     * @param {String} filename
     */
    let replacePasswords = function replacePasswords(encryptedPasswords, filename) {
        var fileContent = grunt.file.read(filename);

        for (let password in encryptedPasswords) {
            // Replace passwords in file, relevant lines only
            let pwdRegex = new RegExp('"password".*:.*"' + password + '"', 'g');
            let pwdReplace = '"password": "' + ENCRYPTION_MARKER + encryptedPasswords[password] + '"';
            fileContent = fileContent.replace(pwdRegex, pwdReplace);

            // Replace OCAPI client secret(s)
            let ocapiRegex = new RegExp('"client_secret".*:.*"' + password + '"', 'g');
            let ocapiReplace = '"client_secret": "' + ENCRYPTION_MARKER + encryptedPasswords[password] + '"';
            fileContent = fileContent.replace(ocapiRegex, ocapiReplace);
        }

        // write result back to file
        grunt.file.write(filename, fileContent);

        grunt.log.write('encryption ');
        grunt.log.ok();
    };

    /**
     * Takes a list of strings and returns an object with their encrypted counterparts
     *
     * @param {Array} passwords
     * @return {Object}
     */
    let encryptPasswords = function encryptPasswords(passwords) {
        let encryptedPasswords = {};

        passwords.forEach(function (password) {
            if (!isEncrypted(password)) {
                encryptedPasswords[password] = encryptString(password);
            }
        });

        return encryptedPasswords;
    };

    /**
     * Decrypts all passwords in config that are relevant for current run
     */
    let decryptPasswords = function decryptPasswords() {
        let environment = grunt.config('environment');

        // Business Manager password
        if (isEncrypted(environment.password)) {
            grunt.config('environment.password', decryptString(environment.password));
        }

        // Business Manager password
        if (environment.client_secret && isEncrypted(environment.client_secret)) {
            grunt.config('environment.client_secret', decryptString(environment.client_secret));
        }

        if (environment && environment.two_factor && environment.two_factor.password) {
            if (isEncrypted(environment.two_factor.password)) {
                grunt.config('environment.two_factor.password', decryptString(environment.two_factor.password));
            }
        }

        let dependencies = grunt.config.get('dependencies');

        dependencies.forEach(function (dependency) {
            if (dependency.repository && dependency.repository.password) {
                if (isEncrypted(dependency.repository.password)) {
                    dependency.repository.password = decryptString(dependency.repository.password);
                }
            }
        });

        grunt.config('dependencies', dependencies);
    };

    /**
     * Encrypts a single string
     *
     * @param {String} string
     */
    let encryptString = function encryptString(string) {
        var cipher = crypto.createCipheriv('des-ede3', ENCRYPTION_PASSPHRASE, '');

        var encryptedString = cipher.update(string, 'utf8', 'base64');
        encryptedString += cipher.final('base64');

        if (encryptedString === null) {
            grunt.fail.warn('Password encryption failed!');
        }

        return encryptedString;
    };


    /**
     * Decrypts a single string
     *
     * @param {string} string the decrypted string
     */
    let decryptString = function decryptString(string) {
        string = string.substring(ENCRYPTION_MARKER.length);

        var decipher = crypto.createDecipheriv('des-ede3', ENCRYPTION_PASSPHRASE, '');
        var plainPwd = decipher.update(string, 'base64', 'utf8');
        plainPwd += decipher.final('utf8');

        return plainPwd;
    };


    /**
     * Run encryption & decryption
     */
    this.run = function (dependencyFilename) {
        if (!this.encryptionEnabled()) {
            grunt.log.write('   * ');
            grunt.log.warn('Password encryption is disabled.');
            return;
        }

        grunt.log.write('   * Password encryption enabled... ');

        let passwords = collectPasswords();

        if (passwords.length == 0) {
            grunt.log.writeln('No passwords found, nothing to encrypt/decrypt. ');
            return;
        }

        // encrypt passwords, write results to config file
        let encryptedPasswords = encryptPasswords(passwords);
        replacePasswords(encryptedPasswords, dependencyFilename);

        // decrypt passwords, write results to current config
        decryptPasswords();
    };


    /**
     * Returns true if encryption is enabled in config
     *
     * @returns {boolean}
     */
    this.encryptionEnabled = function () {
        var settings = grunt.config('settings');
        var enabled = settings.general ? settings.general.password_encryption : true;
        enabled = String(enabled);

        return (enabled != 'false');
    };
};

