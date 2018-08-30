class CatalogWorker
    include Sidekiq::Worker

    def perform(payload)
        catalog_id = payload["catalog"]["id"]
        site_id = payload["catalog"]["siteAssignment"] || ""

        catalog = Catalog.new(
            host:               payload["catalog"]["host"],
            user:               payload["catalog"]["bmUserName"],
            password:           payload["catalog"]["bmPassword"],
            catalog_id:         catalog_id,
            pricebook_id:       catalog_id + "-pricebook",
            inventory_id:       catalog_id + "-inventory",
            pricebook_currency: payload["catalog"]["pricebookCurrency"],
            catalog_name:       payload["catalog"]["name"],
            email:              payload["catalog"]["email"],
            site_id:            payload["catalog"]["siteAssignment"] || "",
            rebuild_search_index: payload["catalog"]["rebuildSearchIndex"] && site_id.present?,
            categories:         payload["catalog"]["categories"],
            images:             payload["catalog"]["images"],
            products:           payload["catalog"]["products"]
        )

        catalog.create_output_folders
        catalog.download_images
        catalog.create_catalog_xml
        catalog.create_site_preference
        catalog.create_price_book
        catalog.create_inventory
        catalog.move_output_to_build_suite
        catalog.create_config_json
        result = catalog.run_build_suite_catalog_populate
        result = result + catalog.run_build_suite_rebuild_index if catalog.rebuild_search_index
        catalog.send_notification_email result if catalog.email.present? && catalog.email != ""
    end
end
