module.exports = {
    options: {
        cartridge: '<%= grunt.config.get("settings.storefront_build_information.target_cartridge") %>',
        template: '<%= grunt.config.get("settings.storefront_build_information.target_template") %>',

        infoTemplatePath: 'default/build',
        infoTemplateFile: 'build_info.isml',
        infoIncludeString: 'build/build_info'
    },

    default: {
    }
};
