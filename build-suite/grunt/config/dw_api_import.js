'use strict';

module.exports = {
    site: {
        options: {
            baseUrl: '<%=environment.server%>',
            fileName: '<%= settings.siteImport.filenames.init %>.zip'
        }
    },
    content: {
        options: {
            baseUrl: '<%=environment.server%>',
            fileName: '<%= settings.siteImport.filenames.content %>.zip'
        }
    },
    meta: {
        options: {
            baseUrl: '<%=environment.server%>',
            fileName: '<%= settings.siteImport.filenames.meta %>.zip'
        }
    }
};
