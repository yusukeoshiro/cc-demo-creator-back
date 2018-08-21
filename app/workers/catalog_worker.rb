class String
    def to_kebab()
        self
            .gsub(/([A-Z]+)([A-Z][a-z])/, '\1-\2')
            .gsub(/([a-z\d])([A-Z])/, '\1-\2')
            .tr("_", "-")
            .downcase
    end

    def to_camel()
        self.split("-").map{|w| w[0] = w[0].upcase; w}.join
    end
end


class CatalogWorker
    include Sidekiq::Worker
    require "open-uri"


    def perform(payload)
        host_name = payload["catalog"]["host"]
        catalog_id = payload["catalog"]["id"]
        pricebook_id = catalog_id + "-pricebook"
        inventory_id = catalog_id + "-inventory"
        pricebook_currency = payload["catalog"]["pricebookCurrency"]
        catalog_name = payload["catalog"]["name"]
        bm_user_name = payload["catalog"]["bmUserName"]
        bm_password = payload["catalog"]["bmPassword"]
        email = payload["catalog"]["email"]
        site_id = payload["catalog"]["siteAssignment"] || ""
        rebuild_search_index = site_id.present? ? payload["catalog"]["rebuildSearchIndex"] : false


        categories = payload["catalog"]["categories"]
        images = payload["catalog"]["images"]
        products = payload["catalog"]["products"]


        output_path = 'tmp/output'
        catalog_path = "#{output_path}/catalogs/#{catalog_id}"
        pricebook_path = "#{output_path}/pricebooks"
        inventory_path = "#{output_path}/inventory-lists"
        site_path    = "#{output_path}/sites/#{site_id}" if site_id.present?

        FileUtils.rm_rf( output_path )




        # STEP 1.
        # download all images to tmp/output/catalogs/CATALOG_ID/static/default/images
        image_path = catalog_path + "/static/default/images" # make a folder

        FileUtils::mkdir_p image_path

        FileUtils::mkdir_p image_path + "/large"
        FileUtils::mkdir_p image_path + "/medium"
        FileUtils::mkdir_p image_path + "/small"

        %W(large medium small).each do | size |
            size_table = {
                "large" => 800,
                "medium" => 400,
                "small" => 300
            }
            dimension = size_table[size]
            images.each do | image |
                url = Cloudinary::Utils.cloudinary_url(image["id"] + ".jpg", :width => dimension, :height => dimension, :crop => :fill)
                open(url) do |f|
                    File.open( image_path + "/" + size + "/" + image["id"] + ".jpg","wb") do |file|
                        file.puts f.read
                    end
                end
            end

        end



        # STEP 2.
        # generate XML file

        b = Nokogiri::XML::Builder.new do |xml|
            xml.catalog("xmlns"=>"http://www.demandware.com/xml/impex/catalog/2006-10-31", "catalog-id"=> catalog_id ) do
                xml.header do
                    xml.ImageSettings do
                        xml.InternalLocation('base-path' => '/images')

                        xml.ViewTypes do
                            xml.ViewType "large"
                            xml.ViewType "medium"
                            xml.ViewType "small"
                            xml.ViewType "swatch"
                            xml.ViewType "hi-res"
                        end

                        xml.VariationAttributeId "color"
                        xml.AltPattern "${productname}, ${variationvalue}, ${viewtype}"
                        xml.TitlePattern "${productname}, ${variationvalue}"
                    end
                end


                # root category
                xml.category("category-id" => "root") do
                    xml.DisplayName({"xml:lang"=>"x-default"}, catalog_name)
                    xml.OnlineFlag true
                    xml.template
                    xml.PageAttributes

                    xml.CustomAttributes do
                        xml.CustomAttribute({"attribute-id"=>"enableCompare"}, false)
                        xml.CustomAttribute({"attribute-id"=>"showInMenu"}, true)
                    end
                    xml.RefinementDefinitions do
                        xml.RefinementDefinition({"type" => "category", "bucket-type" => "none"}) do
                            xml.SortMode "value-name"
                            xml.SortDirection "ascending"
                            xml.CutoffThreshold 5
                        end
                    end
                end

                # repeat for any categories
                categories.each do | category |
                    next if category["isRoot"]
                    xml.category("category-id" => category["id"]) do
                        xml.DisplayName({"xml:lang"=>"x-default"}, category["name"])
                        xml.OnlineFlag true
                        xml.Parent category["parent"]
                        xml.template
                        xml.PageAttributes
                        xml.CustomAttributes do
                            xml.CustomAttribute({"attribute-id"=>"enableCompare"}, false)
                            xml.CustomAttribute({"attribute-id"=>"showInMenu"}, true)
                        end
                        xml.RefinementDefinitions do
                            xml.RefinementDefinition({"type" => "category", "bucket-type" => "none"}) do
                                xml.SortMode "value-name"
                                xml.SortDirection "ascending"
                                xml.CutoffThreshold 5
                            end
                        end

                        # xml.AttributeGroups do
                        #     xml.AttributeGroup("group-id" => "REPLACE") do
                        #         xml.DisplayName({"xml:lang"=>"x-default"}, "REPLACE")
                        #         xml.attribute("attribute-id"=>"REPLACE", "system"=>false)
                        #     end
                        # end
                    end
                end

                # repeat for products
                products.each do | product |
                    xml.product("product-id" => product["id"]) do
                        xml.ean
                        xml.upc
                        xml.unit
                        xml.MinOrderQuantity 1
                        xml.StepQuantity 1
                        xml.DisplayName({"xml:lang"=>"x-default"}, product["name"])
                        xml.OnlineFlag true
                        xml.AvailableFlag true
                        xml.SearchableFlag true
                        xml.images do
                            %W(large medium small).each do | size |

                                xml.ImageGroup("view-type" => size) do
                                    product["images"].each do | image |
                                        xml.image("path" => size + "/" + image["id"] + ".jpg")
                                    end
                                end
                            end
                        end

                        xml.TaxClassId "standard" # TODO FIX THIS
                        xml.brand product["name"]
                        xml.ManufacturerName product["name"]
                        xml.ManufacturerSku product["name"]
                        xml.PageAttributes
                        xml.ClassificationCategory product["category"]

                        # <classification-category>electronics-digital-cameras</classification-category>
                        # xml.CustomAttributes do
                        #     xml.CustomAttribute({"attribute-id" => "REPLACE"}, "REPLACE")
                        # end


                    end
                end
                products.each do | product |
                    # repeat for category assignments
                    xml.CategoryAssignment("category-id" => product["category"], "product-id" => product["id"]) do
                        xml.PrimaryFlag true
                    end

                end
            end
        end

        File.open( catalog_path + "/catalog.xml", 'w') do |file|
            blob = replace_camel b.to_xml
            file.write blob
        end

        # STEP 3.
        # create site preference
        if site_id.present?
            FileUtils::mkdir_p site_path

            b = Nokogiri::XML::Builder.new do |xml|
                xml.preferences( "xmlns"=>"http://www.demandware.com/xml/impex/preferences/2007-03-31" ) do
                    xml.StandardPreferences do
                        xml.AllInstances do
                            xml.preference({"preference-id" => "SiteCatalog"}, catalog_id)
                            xml.preference({"preference-id" => "SiteInventoryList"}, inventory_id )
                            xml.preference({"preference-id" => "SitePriceBooks"}, pricebook_id )
                        end
                    end
                end
            end


            File.open( site_path + "/preferences.xml", 'w') do |file|
                blob = replace_camel b.to_xml
                file.write blob
            end
        end


        # STEP 4.
        # create pricebook
        FileUtils::mkdir_p pricebook_path

        b = Nokogiri::XML::Builder.new do |xml|
            xml.pricebooks( "xmlns"=>"http://www.demandware.com/xml/impex/pricebook/2006-10-31" ) do

                xml.pricebook do
                    xml.header({"pricebook-id" => pricebook_id }) do
                        xml.currency pricebook_currency
                        xml.DisplayName({"xml:lang" => "x-default"}, pricebook_id)
                        xml.OnlineFlag true
                    end
                    xml.PriceTables do
                        products.each do | product |
                            xml.PriceTable({"product-id" => product["id"]}) do
                                xml.amount({"quantity" => 1}, product["price"])
                            end
                        end
                    end
                end
            end
        end

        File.open( pricebook_path + "/#{pricebook_id}.xml", 'w') do |file|
            blob = replace_camel b.to_xml
            file.write blob
        end




        # STEP 5
        # create inventory
        FileUtils::mkdir_p inventory_path

        b = Nokogiri::XML::Builder.new do |xml|
            xml.inventory( "xmlns"=>"http://www.demandware.com/xml/impex/inventory/2007-05-31" ) do

                xml.InventoryList do
                    xml.header({ "list-id" => inventory_id}) do
                        xml.DefaultInstock true
                        xml.description "Created by CC Demo Creator"
                        xml.UseBundleInventoryOnly false
                        xml.OnOrder false
                    end
                end


            end
        end

        File.open( inventory_path + "/#{inventory_id}.xml", 'w') do |file|
            blob = replace_camel b.to_xml
            file.write blob
        end




        # STEP 4.
        # move the folder to build suite and execute build suite
        buildsuite_output_path = "build-suite/output/UNNAMED/site_import/cc-demo-creator"
        FileUtils.rm_rf('build-suite/output')
        FileUtils::mkdir_p buildsuite_output_path

        Dir.glob("tmp/output/*").each do |directory|
            FileUtils.cp_r directory , buildsuite_output_path
        end

        # rewrite config.json
        config = File.read('config.json')
        config.gsub!("<%=HOST>", host_name)
        config.gsub!("<%=USER_NAME>", bm_user_name)
        config.gsub!("<%=PASSWORD>", bm_password)

        File.open( "build-suite/build/config.json", 'w') do |file|
            file.write config
        end

        result = %x( cd #{Rails.root.to_s + "/build-suite"} && grunt catalogPopulate ) # run the custom task called catalogPopulate

        puts result
        p "data import complete..."

        if rebuild_search_index
            p "now rebuilding the search index. this could take a while..."
            result = result + %x( cd #{Rails.root.to_s + "/build-suite"} && grunt triggerReindex ) # run catalog reindex
        end



        puts result


        if email.present? && email != ""
            data = {
                :personalizations => [
                    {
                        :to => [ :email => email ],
                        :subject => 'cc demo creator - build result: ' + DateTime.now.to_s
                    }
                ],
                :from => {
                    :email => "noreply@ccdemocreator.io"
                },
                :content => [
                    {
                        :type => "text/plain",
                        :value => result
                    }
                ]
            }
            sg = SendGrid::API.new(api_key: ENV['SENDGRID_API_KEY'])
            response = sg.client.mail._("send").post(request_body: data)
            if response.status_code.to_i >= 300
                p response.status_code
                p response.body
                p response.headers
                raise "sendgrid send failed"
            end
        end
        puts result

    end


    def replace_camel input
        replacements = %w( ImageSettings InternalLocation ViewTypes ViewType
            VariationAttributeId AltPattern TitlePattern Parent
            DisplayName PageAttributes AttributeGroups AttributeGroup
            CustomAttributes CustomAttribute ImageGroup TaxClassId SearchableFlag AvailableFlag OnlineFrom OnlineFlag MinOrderQuantity
            CategoryAssignment PrimaryFlag ClassificationCategory PinterestEnabledFlag FacebookEnabledFlag
            StepQuantity ManufacturerName ManufacturerSku StandardPreferences AllInstances DisplayName PriceTables PriceTable
            InventoryList DefaultInstock UseBundleInventoryOnly OnOrder
            RefinementDefinitions RefinementDefinition SortMode SortDirection CutoffThreshold)
        replacements.each do |replacement|
            input.gsub!("<#{replacement}", "<#{replacement.to_kebab}")
            input.gsub!("</#{replacement}", "</#{replacement.to_kebab}")
        end
        return input
    end

end
