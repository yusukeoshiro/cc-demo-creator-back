# Changelog

## (unreleased)

### Changed
 - Encryption mechanism: Now encrypts all passwords, write-back less error prone (#88)
 - Adapted to MFRA => SFRA renaming

### Fixed
 - CSS/JS merge: Files do not get overwritten anymore (#69)
 - MFRA repository URL, disabling CSS/JS optimization in sample config


## [[1.2.2](https://bitbucket.org/demandware/build-suite/commits/tag/1.2.2)] - 2018-04-25

### Added
 - Possibility to trigger NPM task execution as part of build
 - Possibility to trigger metadata import via OCAPI
 - Zip Chunk mechanisms for files >100 MB - applies for both Site Import and Code upload (dw_compress)
 - `grunt help` task to list only commands that are supposed to be called by the user

### Removed
 - "per_cartridge" upload mode (no longer eneded)
 - Eclipse part in Readme (no longer relevant)
 - "compress" module (and task configuration), replaced by dw_compress
 
### Fixed
 - Proper error handling for missing dependency / repository / url
 - Issue when using `--migrate`: Site import paths are now migrated properly
 - Some missing cleanups for `--migrate`
 - Issue #84: Missing Origin broke reindex task (thank you @ccool for contributing)

### Changed
 - Metadata import to utilise file import (behaviour stays the same!)
 - Marked front-end build tasks as DEPRECATED
 - Changelog location. (You already found it if you read this.)
 - Default behaviour of settings.upload.cleanup: Now deleting zip file by default.


## [[1.2.1](https://bitbucket.org/demandware/build-suite/commits/tag/1.2.1)] - 2017-12-19

### Added
 - ESLint configuration + compliance, VS project files exclusion in gitignore
 - Opt-In for using OCAPI for Site Import + Code Activation
 - Bitbucket pipeline with basic tests
 
### Removed
 - JSCS + JSHint configurations (please use ESLint to lint the Build Suite)

### Fixed
 - Issue when using `--migrate` with older config.json files
 - Replacement of numeric values for placeholders (fixes #68)
 - Error handling for code activation if no response from server
 - Error handling in case project name is missing (fixes #67) 

## [[1.2.0]](https://bitbucket.org/demandware/build-suite/commits/tag/1.2.0) - 2017-05-19

### Fixed
 - Business Manager login + Code activation (see #64)
 - Metadata import now completely supports CSRF  too (thanks @rzhornyk!)

### Added
 - Possibility to use single JSON file
 - Possibility to define multiple environents and select one for deployment (also per command line argument)
 - Command line parameter support for config placeholders (thanks @ast_osevastianovych!)
 - Decent documentation for: (selective) site import + environment-based replacements
 
### Changed
- JSON (and internal) configuration structure for "settings" (backwards compatible)
 - "--migrate" functionality to support new "settings" structure
  

## [[1.1.1]](https://bitbucket.org/demandware/build-suite/commits/tag/1.1.1) - 2017-02-22

### Added
 - More descriptive warning for missing cartridges

### Changed
 - Business Manager requests to be CSRF compliant (see #34)
 - Indentation: Only whitespaces used from now on (as requested in #11)

### Fixed
 - Cert URL handling for two-factor-auth
 - URL encoding for Git credentials when using HTTPS (fixes #53) 
 - Code activation for two-factor auth
 - Client-side Javascript issues (decreased lodash version back to 3.10, fixes #58)
 - Behaviour of "ignoreEmpty" flag" (now able to skip missing cartridges again)
 

## [[1.1.0]](https://bitbucket.org/demandware/build-suite/commits/tag/1.1.0) - 2017-01-06
### Added
- Command line parameter "--migrate" which prints configuration in the latest format.
- Additional Log output on repositories should make it easier to locate mistakes in configuration
- SiteGenesis Sample configuration! Full-fledged build now works OOTB
- Command line parameter "--print-config" for either printing complete or partial configuration data (e.g. "--print-config=cssmin")
- Empty directory check for site import (no more silently created empty Zip files!)

### Removed
- Support for .properties files, removed migrate feature (Please run `grunt --migrate` BEFORE upgrading to this release)
- ESLint package dependency (will come back with new linting feature in future release)
- Legacy task names (e.g. RunProjectBuild). Please adapt to current naming convention.
- Lots of unused dependencies (solves #47, #48) 

### Changed
- Internal property names have changed drastically. Origin of properties should be clearer now. Output and exports folders location now a property.
- Initialization and internal configuration structure cleanup (removed a lot of unnecessary and complicated mappings)

### Fixed
- Two-factor auth now working for unzip and cleanup again.
- Clean task for parallel builds. Does not fail anymore, output folder structure was changed. (fixes #14)
- CSS Minification
- Fixed Git fetch mechanism when switching branch (again. solves #49)



## [[1.0.1]](https://bitbucket.org/demandware/build-suite/commits/tag/1.0.1) - 2017-01-02
### Changed:
- Changed exlusion of hidden files (e.g. .project) into an opt-out option (solves #26)
- Fixed code quality issues (regarding linting the Build Suite itself), renamed config files (solved #35, #36)
- Changed Documentation (widely updated and improved)
- Changed SASS configuration, improved folder structure
### Fixed:
- Restored "gitfetch" task in order to reduce update time for Git repositories
- Fixed Git fetch mechanism when switching branch (solved #40)
- Bugfix regarding repository names with dots (solved #9)
- Fixed JS/CSS merging (solved #38)
- Fixed syntax in config example files (solved #37)
### Added:
- Restored and improved Storefront Toolkit Build Info feature! (solves #6)


## [[1.0.0]](https://bitbucket.org/demandware/build-suite/commits/tag/1.0.0) - 2016-04-26 
### Removed:
- unused configuration parameters in configuration files
### Changed:
- updated configuration file structure to benefit from JSON format
- restructured (demo) site import, extended functionality and configurability
### Added:
- proper default values for less used configuration parameters
- documented copies of configuration files
- additional log output in case of errors to improve usability

## [[Grunt Branch]](https://bitbucket.org/demandware/build-suite/src/4ad8e2001b5a4200422ced9844df545dd6f45ae5/?at=grunt) - 2015-02-27
- Merged new features in to grunt branch including support for svn and two factor auth.
- IMPORTANT: ALL properties files are being moved to json files to support more advanced configuration.  A merge option exists to merge the global properties files.  The project repository folders should be converted by hand if you use any advanced options.  A sample file is provided. 
- Known Issues: Two factor auth will successfully push the archive to the remote server.  It is a known issue that it will not unzip nor activate.  We are working on that.
