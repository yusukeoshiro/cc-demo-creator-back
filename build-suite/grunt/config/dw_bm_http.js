module.exports = {
    options: {
        method: 'POST',
        headers: {
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'gzip,deflate',
            'Accept-Language': 'de-de,de;q=0.8,en-us;q=0.5,en;q=0.3',
            Connection: 'keep-alive',
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:25.0) Gecko/20100101 Firefox/25.0'
        }
    },
    validateCustomMeta: {
        options: {
            url: 'https://<%= environment.server %>' +
              '/on/demandware.store/Sites-Site/default/ViewCustomizationImport-Dispatch',
            form: {
                SelectedFile: 'custom-objecttype-definitions.xml',
                ProcessPipelineName: 'ProcessObjectTypeImport',
                ProcessPipelineStartNode: 'Validate',
                JobDescription: 'Validate+systemmeta+data+definitions',
                JobName: 'ProcessObjectTypeImpex',
                validate: ''
            },
            jar: true
        }
    },
    validateSystemMeta: {
        options: {
            url: 'https://<%= environment.server %>' +
              '/on/demandware.store/Sites-Site/default/ViewCustomizationImport-Dispatch',
            form: {
                SelectedFile: 'system-objecttype-extensions.xml',
                ProcessPipelineName: 'ProcessObjectTypeImport',
                ProcessPipelineStartNode: 'Validate',
                JobDescription: 'Validate+custommeta+data+definitions',
                JobName: 'ProcessObjectTypeImpex',
                validate: ''
            },
            jar: true
        }
    }
};
