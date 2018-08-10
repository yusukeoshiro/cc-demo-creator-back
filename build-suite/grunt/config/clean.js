module.exports = {
    build: [
        '<%= dw_properties.folders.output %>'
    ],
    site: [
        '<%= dw_properties.folders.site_import %>'
    ],
    code: [
        '<%= dw_properties.folders.code %>'
    ],
    complete: [
        '<%= dw_properties.folders.output %>',
        '<%= dw_properties.folders.repos %>'
    ]
};
