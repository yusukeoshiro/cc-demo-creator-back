module.exports = {
    default: {
        options: {
            lines: [
                '',
                ' * Build Steps:',
                '',
                '      build -- run a build. Build Pipeline:',
                '           * VCS checkout',
                '           * trigger NPM tasks',
                '           * Copy relevant files to staging folder',
                '           * Run sass/browserify,',
                '           * Run uglify/cssmin, merge JS + CSS',
                '           * Zip result (either into one file or one per cartridge)',
                '',
                '      upload -- upload the code version zip file (which was created during build step)',
                '',
                '      activate -- activate the uploaded code version',
                '',
                '      dist -- build + upload + activate, deletes uploaded zip file',
                '',
                '',
                ' * Site Import Tasks: (Note: Site import data must be staged first by running at least "build")',
                '',
                '      initSite -- Upload and import site initialization data (from siteImport.initPath)',
                '',
                '      initDemoSite -- Upload and import demo site data (from siteImport.demoPath)',
                '',
                '      importSite -- Upload and import complete site data (includes init + demo)',
                '           * Note: Files from demoPath will overwrite their counterparts from initPath.',
                '',
                '      importMeta -- Fetch only metadata from initPath (+demoPath), upload and import it.',
                '',
                '',
                ' * For more information please consult the README.md file *'
            ]
        }
    }
};
