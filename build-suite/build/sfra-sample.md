#Build Suite - Mobile First Refernce Architecture Default Setup

This folder contains a default setup that can be used as a blueprint for projects based on the Storefront Reference Architecture (SFRA)

## Quickstart: Run a build
1. Make sure your Bitbucket SSH certificate is setup properly. (Or configure HTTPS + Username + Password in the repsitories configured in `sfra-sample.json` - see Documentation)
1. Run `grunt build --project=sfra-sample`
1. A complete, CSS/JS-compiled SiteGenesis can be found in `output/sfra-sample/code`.
1. The corresponding (demo) site import data can be found in `output/sfra-sample/site_import/site_init`

## How to deploy code
1. Make a copy of `sfra-sample.json`, name it as desired (e.g. "myProject.json")
1. Open new file, set up your sandbox properly (WebDAV URL + Business Manager credentials)
1. Run `grunt dist --project=myProject` to deploy a vanilla SFRA build to your Sandbox.
1. For demo- and metadata see next step.

## How to deploy metadata and demo data
1. Make sure code deployment is working properly (see above)
1. Open the JSON file created in the last section
1. Set `settings.siteImport.enabled` to `true`
1. Run `grunt importSite --project=myProject` to import configuration, metadata and demo data in one step.

## Selective import of demo data / metadata / configuration
1. Run `grunt initSite --project=myProject` to import the whole demo data.
1. Run `grunt importMeta --project=myProject` to import metadata only.


## Note
Please see the `config.json.*-sample` and `config.json.*-doc` files containing sample and documented configurations for both full-fledged and minimum setup.