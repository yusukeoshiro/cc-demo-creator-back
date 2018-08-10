'use strict';

module.exports = {
    options: {
        server: 'https://<%= environment.server %>',
        useRealm: false,
        exportName: 'units_<%= grunt.template.today("yyyy-mm-dd\'T\'HH.MM.ss") %>'
    },
    default: {
        sitesToExport: '<%= settings.siteExport.sites %>',
        unitsToExport: {
            global: [
                'GlobalPreferencesExport',
                'GlobalCustomObjectExport',
                'MetaDataExport',
                'SchedulesExport',
                'OAuthProvidersExport'
            ],
            units: [
                'SiteExport_[SITE]_FeedExport',
                'SiteExport_[SITE]_CacheSettingsExport',
                'SiteExport_[SITE]_CustomerGroupExport',
                'SiteExport_[SITE]_SiteCustomObjectExport',
                'SiteExport_[SITE]_PaymentMethodExport',
                'SiteExport_[SITE]_PaymentProcessorExport',
                'SiteExport_[SITE]_SitePreferencesExport',
                'SiteExport_[SITE]_SearchExport',
                'SiteExport_[SITE]_ShippingExport',
                'SiteExport_[SITE]_StorefrontUrlExport',
                'SiteExport_[SITE]_StoreExport',
                'SiteExport_[SITE]_TaxExport',
                'SiteExport_[SITE]_SortExport',
                'SiteExport_[SITE]_SitesExport'
            ]
        }
    }
};

