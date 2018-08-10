module.exports = {
    site: {
        options: {
            ocapi_tasks: [
                'dw_api_import:site'
            ],
            bm_tasks: [
                'dw_bm_login',
                'dw_bm_ensure_no_import:config',
                'dw_bm_import:site',
                'dw_bm_checkprogress:config'
            ]
        }
    },
    meta: {
        options: {
            ocapi_tasks: [
                'dw_api_import:meta'
            ],
            bm_tasks: [
                'dw_bm_login',
                'dw_bm_ensure_no_import:config',
                'dw_bm_import_site:default',
                'dw_bm_checkprogress:config'
            ]
        }
    }
};
