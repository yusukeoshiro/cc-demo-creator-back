#Build Suite

## Introduction
An easy-to-use set of scripts to automate your build processes and add some additional value to it: Configure your (Git) repository and target environments; then hit the button to package a build, deploy it to your environment and automatically activate the new code version afterwards.

The build suite is powered by [Grunt](http://gruntjs.com) - a popular and well-tested Javascript task runner. It is part of the [Community Suite](https://xchange.demandware.com/community/developer/community-suite) set of tools.

### License
Licensed under the current NDA and licensing agreement in place with your organization. (This is explicitly not open source licensing.)

## Contributing

1. Create a [fork](https://bitbucket.org/demandware/build-suite/fork), if you don't already have one
2. Ensure your fork is caught up (message from Bitbucket shows up on your fork main page, if you are not current on commits)
3. Create a new branch in your fork to hold your changes
4. Submit a [pull request](https://bitbucket.org/demandware/build-suite/pull-requests/new)

### Who do I talk to?

Feel free to create issues and enhancement requests. Please check existing ones and read the [Frequently asked Questions](https://bitbucket.org/demandware/build-suite/wiki/FAQ) first.

* [Commerce Cloud Community Slack](https://sfcc-community.slack.com/messages/C0Z4NCDAS)
* [Community Suite discussion board](https://xchange.demandware.com/community/developer/community-suite/content)
* Maintainer: @dmersiowsky


## Changelog

*Note:* Instead of using explicitly released versions, it is recommended to pull the current head in order to benefit from our latest fixes and improvements. 

The full changelog can be found in [CHANGELOG.md](https://bitbucket.org/demandware/build-suite/src/master/CHANGELOG.md)

## Getting started

### Installation

1. We recommend to use either [Git Bash](https://git-for-windows.github.io/) or [Cygwin](https://www.cygwin.com/) on Windows environments. Nevertheless, Windows CMD should work too.
1. Node.js version 4.4 or higher is required. You can [download it here](https://nodejs.org/en/download/)
1. Open the command line in the root folder of this repository and type ```npm install```. Installation could take a while.

* Problems? Refer to the [Frequently asked Questions](https://bitbucket.org/demandware/build-suite/wiki/FAQ) section.
* See also: [Grunt Getting Started](http://gruntjs.com/getting-started).

### Quick Start

*See `sitegenesis-sample.json` for a working OOTB SiteGenesis configuration example.*

The following steps describe the shortest way to run the Build Suite:

1. Create a copy of `sitegenesis-sample.json`, name it `config.json`

1. Configure for your deployment target in `environments` (Instance URL and credentials).

1. Optional: Set `settings.project.version` to the code version name that will be used (e.g. 'build-suite-test').

1. Run a complete build and deploy with `grunt dist`.


### Detailed Steps to run a build

1. Copy `config.json.sample`, name as desired (e.g. `myProject.json`)

    * You can configure multiple projects to be processed from the same build suite installation by creating multiple JSON files. 
    * Add e.g. `--project=myProject` to the grunt command to select a project.
    * If no project name is specified, the Build Suite will look for a `config.json` file.
    
1. Configure settings

    * The `settings.project.version` property represents the name of the code version that will be created and activated on the server.
    * The optional `settings.project.build` property is meant to carry the build/version number.
   
1. Set up dependencies

    * The Build Suite currently supports SVN and Git. 
    * Be sure that the given tool is working properly using the corresponding command in the command line environment!
    * The dependency file can contain multiple SVN and/or Git repositories. Each repository can be configured separately.
    * Local repositories can be configured through relative paths. Note that the `build` folder is the CWD, so start with `../`.

1. If you want to use Git SSH URIs you need to setup the Git SSH key accordingly.

    * If your ssh key contains a passphrase (optional), you will need to use a password saver like ssh_agent so that you are not prompted for your passphrase which will hang the script when running in the UX Studio Plugin. (See https://help.github.com/articles/working-with-ssh-key-passphrases.)
    * It is also recommended that you set the GIT_SSH environment variable to the ssh executable that was included in your Git installation to avoid problems with the build script from hanging in UX Studio Plugin.

1. Set up environments
 
    * You can configure multiple environments. Those are identified with their key/name.
    * If only one environment is set up, it will always be used as a default.
    * If multiple environments are set up, use the `settings.general.target_environment` property to set the default target.
    * The target can also be set via the `--target` command line parameter, e.g. `--target=mySandbox`
    * For the `environments.[x].server` property be sure to use the instance hostname with dashes so that you do not run into any SSL exceptions when connecting to the target environment with the Build Suite. E.g.: `instance-realm-customer.demandware.net`.

1. Add front-end build scripts to the build process
    * The Build Suite supports script execution through [npm's `scripts` directive](https://docs.npmjs.com/misc/scripts).
    * Once added to your package.json, open your `config.json` and head to the `dependencies.*.npm` section
    * In that section, list all the scripts that should be called during build
    * You can configure the build suite to execute `npm install` by setting `npm.install` to true

1. Test your configuration by calling e.g. `grunt build --project=[projectName]` and `grunt upload --project=[projectName]` afterwards.


## Documentation

### Configuration

For a full list of configuration parameters, default values, and documentation, see [documented Config example](https://bitbucket.org/demandware/build-suite/src/master/build/config.json.full-doc)


### Available Tasks

Run `grunt help` to receive a list of available tasks. All of the main tasks are defined in the aliases.yml file.

(*Note:* Please be aware that `grunt --help` lists _all_ tasks, no matter if they are supposed to represent subtasks or tasks that are considered to be run from the command line.)

#### Build

* `grunt build` performs a checkout and local build of the complete project
* `grunt upload` performs code upload of previously built project
* `grunt activate` activates the configured code version
* `grunt dist` performs build, upload, activate and cleans up uploaded file (call `grunt http:deleteUpload` to do this manually). 

#### Site Import 

An import of site configuration can be done after the build or dist task. 
To configure Site import, see [documented Config example](https://bitbucket.org/demandware/build-suite/src/master/build/config.json.full-doc) and check against assumed folder structure below. The site import can be divided into two parts: 1. Configuration/Initialization and 2. Demo Site data (optional).

* `grunt initSite`: Site initialization/configuration import (default source folder: `sites/site_template`)
* `grunt initDemoSite`: Demo site import (default source folder: `sites/site_demo`)
* `grunt importSite`: Complete site import, including demo site (if given)
* `grunt importMeta`: Metadata import. Metadata is always read from configuration data (default: `sites/site_template/meta`)

#### Other tasks

* `grunt triggerReindex`: Trigger a Search Index rebuild for all Sites of the target environment
* `grunt exportUnits`: Trigger a site export for all Sites given in `settings.site_export.sites`
* `grunt` (without task name): Start Watch task, will constantly check for updates in JS+SCSS and rebuild automatically while running.

### Repository contents

     -root
      |-build
      | |-config.json.min-sample            Minimum possible configuration template. Copy to config.json for basic use.
      | |-config.json.min-doc               Documentation for minimum config. Do NOT use as template!
      | |-config.json.full-sample           Full configuration template. Copy to config.json for advanced use.
      | |-config.json.full-doc              Full documentation for config. Do NOT use as template!
      | |-sfra-sample.json                  Sample configuration for Storefront reference architecture (SFRA)
      | |-sfra-sample.md                    Quickstart documentation for SFRA
      | |-sitegenesis-sample.json           SiteGenesis sample configuration (works OOTB)
      | `-sitegenesis-sample.md             Quickstart documentation for SiteGenesis sample
      |
      |-grunt                               Grunt Configuration and tasks
      | |-config                            Alias (alias.yml) and Configuration parameters (*.js)
      | |-lib                               Utility/Initialization modules
      | `-tasks                             All Demandware specific task plugins
      |
      |-resources                           Sample template for storefront toolkit, OCAPI configuration
      |
      |-Gruntfile.js                        Main Gruntfile 
      `-package.json                        Node Package Manager dependencies

### Command line parameters

You can select a configuration file and one of the contained target environments.

#### Project Selection

Per default, the Build Suite is looking for a `config.json` file in its "build" folder. If you want to have multiple 
files, feel free to make use of the `--project` parameter.

    --project=myProject
    
This will load `build/myProject.json`.

You can move your JSON files into subfolders and load them by adding the path accordingly. E.g. `--project=myProjectFolder/myProject.json`.


#### Environment Selection

You can define multiple target environments to deploy to. If only one is configured, the Build Suite will deploy
to that environment per default. If you have given multiple environments, you can either select one via the 
`settings.general.target_environment` setting or via the `--target` parameter. Example:

    --target=dev11
    
Will select `environments.dev11`.

Note: If you want to deploy the same build to multiple environments, call `grunt build` first and  
`grunt upload activate --target=dev12` etc. afterwards for every environment you want to deploy to.

#### Print task configuration

For evaluating the configuration, which is partially generated during startup, is assembled correctly, you can use the `--print-config` parameter. If used without a value, the complete configuration is written to the output. It is also possible to get a partial output by e.g. using `--print-config=cssmin` for only printing the cssmin task configuration.


### Default repository structure

The structure below is assumed for a Git repository. All defaults stick to this scheme. If your structure differs, please adapt the corresponding folder settings. All of them are visible in the [documented project configuration example file](build/projects/sample/config.json.full-sample).

     -root
        |-cartridges                 (all Demandware cartridge projects)
        | |-app_sample
      | |-...
      | `-bm_plugin
        |
        `-sites
          |-site_template            (site template structure as defined for site import)
          | |-custom-objects
          | |-meta
          | `-sites
          |   |-site_a               (actual site definitions)
          |   `-site_b               (actual site definitions)
          |-site_demo
          | |-catalogs               (demo site data, example products/customer accounts etc.)
          | |-pricebooks
          | `-sites
          |   |-site_a               (actual site definitions)
          |   `-site_b               (actual site definitions)
          `-config                   (optional: target-instance based configurations that perform replace operations on init/demo data)
            |-dev_a                  (environment config folder)
            |-dev_b
            |-stg
            `-prd


### Two-factor authentication

Two-factor authentication (2FA) is needed for certain PIG instances. You will need the 2FA passphrase and a [certificate file](https://xchange.demandware.com/blogs/pnguyen06/2016/08/20/dw-tut-create-a-p12-certificate). The certificate file must be made available in the file system.

To activate 2FA:

- Make sure you can connect using 2FA (using a WebDAV client of your choice)
- Do NOT change the `server` setting of your environment, it should still start with "staging"
- In the configuration file, add the following setting to your environment:

```json
{
    "two_factor": {
        "enabled": true,
        "password": "secure",
        "cert": "certs/mycert.p12",
        "url": "cert.staging...."
    }
}
```

The certificate file path can be either absolute or relative. If relative, consider the build suite root as the root folder for your path.


## Site import

The Build Suite decides between two kinds of Site import:

 - Site Template / Configuration import (`importConfig` task)
 - Demo data import (`importDemo` task)

Both can be run together using the `importSite` task. `importMeta` can be used to import updated metadata (e.g. CustomObjects) only. 

The site import will only be created when `settings.siteImport.enabled` is set to true. Note that the `build` task prepares the Site import while the import tasks only processes and uploads the site import data. ("Prepare" means that the site import data is checked out from the VCS and copied to a staging folder.)

While site templates can also be imported to PIG environments, demo data is meant to only be used for setting up Sandboxes with a representative dataset (e.g. content/catalog). 

### Site template

The site template is based on the site structure contained within the site import zip files. So the best way to create a site template is to export configuration data from an already configured instance via Business Manager and then unzip, select and modify the needed files.

The site template should be placed in the `sites/site_template` folder of your repository and contain configuration data only (e.g. basic Site setups and preferences).

Since each repository can contain a site template, the build process combines them all by copying the contents into the same directory and then compressing and uploading it. The idea behind this is that each project may define their own site. Please mind that files might get overwritten if they are in the same location. So it is a good idea to have all global files (e.g. metadata) in one cartridge and only site-related configuration in the corresponding site cartridges. 

It's recommended to have just configuration inside the site template structure, no content/catalog  data at all. Demo data should go in a separate directory (see below). 

The purpose behind this concept is to enable users to...

1. deploy the site template to a PIG in order to add new or update existing preferences along with a code release
2. deploy the site template along with demo data on a plain Sandbox in order to rapidly set up a development environment containing representative product catalogs, customer accounts, content libraries etc.


### Demo data

Demo data works similar to site templates and follows the same structure. Demo data should be placed under `sites/site_demo`. Please note there is a max upload size limit of 100 MByte over webdav.


### Meta data

Meta data is expected to be found in the site template. However, it is also fetched from demo data as a fallback. Accordingly, meta data will be imported along with the site import that contains the corresponding files. 


### Using OCAPI Data API for Site imports

In order to enable OCAPI, the following steps have to be taken:

 * Copy the OCAPI preferences from sample file `resources/ocapi_settings.json` and add it to the client ID you are using. (Business Manager: Administration >  Site Development >  Open Commerce API Settings)
 * Add the OCAPI Client ID + secrect to the configuration (see configuration section). 
 
The Build Suite will automatically switch to OCAPI if credentials are found in the configuration.

Supported tasks:

 * Site import
 * Content import (note that this is run using the standard site import job!)
 * Code activation


### Environment-based Site import

Based on the selected environment, it is possible to apply particular replacements in the site template, meta data, or even demo data.
The mechanism is to use the configured site template as a basis and apply replacements to it. Three types of replacements are possible:

 * Text-based replacements (e.g. replace `https://mywebserviceurl-production.com` with `https://mywebserviceurl-test.com`)
 * XML/XPath-based replacements (see example below)
 * File-based replacements (e.g. replace `sites/SiteGenesis/preferences.xml` with another file)

How to use:

1. Make sure the standard site import is configured and working properly.
1. In the desired dependency in your configuration, set `siteImport.environmentPath`:
1. The path should be relative to the repository root. (e.g. `sites/config` if the sites folder is in your repository root)
1. In the folder configured above, create a subfolder that matches the target environment key in your configuration:
1. E.g. if you want to set up replacements for `environments.dev01`, create a subfolder called `dev01`.
1. In that folder you can now start to place files that will overwrite their counterparts in the standard site import.
1. Additionally, create a `config.json` file in the folder in order to set up replacements.
1. Find an example for configuring replacements below
1. After running a new build, when running the site import again, replacements will be applied if the environment is selected. 

Sample `config.json` for replacements:


```json
{
    "xmlReplacements": [{
        "options": {
            "namespaces": {
                "t": "http://www.demandware.com/xml/impex/preferences/2007-03-31"
            },
            "replacements": [{
                "xpath": "/t:preferences//t:preference[@preference-id=\"SiteLibrary\"]",
                "value": "MyCustomLibrary"
            }]
        },
        "files": ["sites/*/preferences.xml"]
    }],
    "textReplacements": [{
        "options": {
            "replacements": [{
                "from": "production-list-prices",
                "to": "development-list-prices"
            }]
        },
        "files": [
            "sites/*/preferences.xml"
        ]
    }]
}
```


For more information on the mechanism behind xmlReplacements, please refer to the [xmlpoke](https://github.com/bdukes/grunt-xmlpoke) documentation.
The `xmlReplacements.options` section represents the xmlpoke options array and is passed as-is. This enables users to use the full feature set of xmlpoke.
Especially the namespaces should gain some attention, since xmlpoke will rely on the correct namespace reference. 


For more information on the mechanism behind textReplacements, please refer to the [grunt-text-replace](https://github.com/yoniholmes/grunt-text-replace) documentation.
Text replacements are applied through regular expressions, simple text replacements (as shown above) are possible too. The options.replacements array is passed as-is to the grunt-text-replace module. 


## Storefront Toolkit Build Info

The Build Suite can add information about the current build into the Storefront Toolkit. If enabled, the Build Suite will add an additional menu item to the Storefront Toolkit menu, which, when clicked, shows an overlay with information about the current build.

To enable this feature, see the `settings.storefront_build_information` section in your configuration file (please refer to sample file for example/default values):

- `enabled`: set to true or false to enable or disable the Build Info for the current target.
- `target_cartridge`: The (storefront) cartridge to add the template containing the Build Info output. The template is always placed in the default/debug template folder and will be named "build_info.isml".
- `target_template`: The template that should contain the include of the Build Info output. Not that you will not have to care about the layout or output, the template only adds an overlay that is shown when the corresponding menu item in the SF toolkit is clicked. (Please note that we are using inline Javascript here, so please choose a footer template.)

If you're using the standard SiteGenesis template structure, you will not have to change the `target_template` value.


## DEPRECATED Features

### Sass (deprecated due to NPM script support)

By default, the `build` task looks for a `style.scss` file in the `scss` directory of every cartridge. The output, the complied `style.css` is put in `static/default/css` in the same cartridge. 
Two parts of this process are configurable per dependency: You can change the file name from `style.scss` via `environment.sass.sourceFile` (target filename will always be the same with .css ending).
You can also change the source directory from `scss` to anything you want (e.g. `sass\source`). Since Site Genesis proposes a fixed folder structure for CSS files, the target directory is not configurable. Also, as we propose to use only one front-end cartridge providing CSS, the abovementioned properties are not configurable per cartridge but in a global manner only.


### Autoprefixer (deprecated due to NPM script support)

[Autoprefixer](https://github.com/postcss/autoprefixer) parses CSS and adds vendor-prefixed CSS properties using the [Can I Use](http://caniuse.com) database.
The `build` task runs `autoprefixer` on all `.css` files. By default, `autoprefixer` target these browsers: `> 1%, last 2 versions, Firefox ESR, Opera 12.1`. The ability to configure specific browser targets will be added in the future.


### Resource optimization (deprecated due to NPM script support)

The Build Suite allows you to concatenate and minify your CSS and Javascript resources. Resource optimization can be enabled via `settings.optimize.js` and `settings.optimize.css`.

Resource concatenation can be enabled via `settings.optimize.concatenate`. If enabled, it is controlled via markups in ISML templates: Special comments have to be placed before and after an include block. Inside the first comment, the relative source path has to be defined along with the target filename. See below for details.

**Please note:** Only files in the same cartridge can be merged. Also, please be aware that target filenames have to be unique. In general we recommend to only use one storefront cartridge containing all static files. 


##### CSS example

```html

<!--- BEGIN CSS files to merge.(source_path=cartridge/static/default;targetfile=css/allinone.css) --->
<link rel="stylesheet" href="${URLUtils.staticURL('/css/example1.css')}" />
<link rel="stylesheet" media="print" href="${URLUtils.staticURL('/css/example2.css')}" />
<link rel="stylesheet" href="${URLUtils.staticURL('/css/example3.css')}" />
<!--- END CSS files to merge. --->
```

##### JS example

```html

<!--- BEGIN JS files to merge.(source_path=cartridge/static/default;targetfile=js/allinone.js) --->
<script src="${URLUtils.staticURL('/lib/example1.js')}" type="text/javascript"></script>
<script src="${URLUtils.staticURL('/lib/jquery/example2.js')}" type="text/javascript"></script>
<!--- END JS files to merge. --->
```


## Hints

### Linting, Unit Tests, etc.

Linting and tests should be set up as NPM tasks at the repository. If you want to run NPM tasks as a part of the build, add them to the `npm` part of your repository.

#### Need to configure the build per run in you CI environment, maybe via commandline? 

Please refer to the CI section in the [FAQ](https://bitbucket.org/demandware/build-suite/wiki/FAQ).

#### Need to use a folder other than `cartridges` for my code?

In your configuration, set repository property `repository.source.path` to match your source folder name. 
Please note that this setting is **defaulting to `cartridges`**! 
So e.g. if there is no `cartridges` folder in your repository, but cartridges right in the repository root, this folder will have to be configured as `"."`.


#### Need to specify which directories in your project to upload?

In your configuration, set dependency property `repository.source.glob` to select desired files/directories.
By default, it is set to upload everything `**/*`. Grunt's [globbing pattern](http://gruntjs.com/configuring-tasks#globbing-patterns) is used here.
**Note:** The curly brackets for "or" operation `{}` cannot be used per default due to the limitation of Java Properties file. If you want to use them, enter the globbing pattern as a CSV string.

Examples:
 * For example, to ignore a file, set `glob` to `['**/*','!filename']`.
 * To ignore a folder, set `glob` to `['**/*','!**/folder/**']`. 
 * To use curly brackets, enter a string instead of an array: `"'**/*','!filename'{.js,.css}"`


#### Version numbers

The version numbers should contain 3 digits i.e. `1_0_0` where the first digit represents a major release, the second a minor point release/update and the third digit a hot fix update.
I.e. if you are doing multiple releases to UAT fixing small issues you will only update the bug fix/update number. 
Release numbers should be separated by _ only. 
We recommend to stick to the best practices explained in [semantic versioning](http://semver.org/) along with [an appropriate changelog](http://keepachangelog.com/).