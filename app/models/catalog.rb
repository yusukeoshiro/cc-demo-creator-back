class Catalog
    include ActiveModel::Model
    attr_accessor :host, :user, :password,
        :catalog_id, :pricebook_id, :inventory_id, :pricebook_currency, :catalog_name, :email, :site_id, :rebuild_search_index,
        :categories, :images, :products

    def create_output_folders
        FileUtils.rm_rf( output_path )
        FileUtils.rm_rf('build-suite/output')
        FileUtils::mkdir_p self.image_path
        FileUtils::mkdir_p self.image_path + "/large"
        FileUtils::mkdir_p self.image_path + "/medium"
        FileUtils::mkdir_p self.image_path + "/small"
        FileUtils::mkdir_p site_path if self.site_id.present?
        FileUtils::mkdir_p pricebook_path
        FileUtils::mkdir_p inventory_path
        FileUtils::mkdir_p buildsuite_output_path

    end

    def download_images
        require "open-uri"
        puts "downloading images..."
        size_table = { "large" => 800, "medium" => 400, "small" => 300 }
        %W(large medium small).each do | size |
            images.each do | image |
                url = Cloudinary::Utils.cloudinary_url(image["id"] + ".jpg", :width => size_table[size], :height => size_table[size], :crop => :fill)
                open(url) do |f|
                    File.open( image_path + "/" + size + "/" + image["id"] + ".jpg","wb") {|file| file.puts f.read}
                end
            end
        end
    end


    def create_catalog_xml
        puts "creating catalog xml..."
        b = Nokogiri::XML::Builder.new do |xml|
            xml.catalog("xmlns"=>"http://www.demandware.com/xml/impex/catalog/2006-10-31", "catalog-id"=> self.catalog_id ) do
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
                    xml.DisplayName({"xml:lang"=>"x-default"}, self.catalog_name)
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
                self.categories.each do | category |
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
                    end
                end

                # repeat for products
                self.products.each do | product |
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
    end


    def create_site_preference
        puts "creating site preference..."
        b = Nokogiri::XML::Builder.new do |xml|
            xml.preferences( "xmlns"=>"http://www.demandware.com/xml/impex/preferences/2007-03-31" ) do
                xml.StandardPreferences do
                    xml.AllInstances do
                        xml.preference({"preference-id" => "SiteCatalog"}, self.catalog_id)
                        xml.preference({"preference-id" => "SiteInventoryList"}, self.inventory_id )
                        xml.preference({"preference-id" => "SitePriceBooks"}, self.pricebook_id )
                    end
                end
            end
        end
        File.open( self.site_path + "/preferences.xml", 'w') do |file|
            blob = replace_camel b.to_xml
            file.write blob
        end
    end


    def create_price_book
        puts "creating price book..."
        b = Nokogiri::XML::Builder.new do |xml|
            xml.pricebooks( "xmlns"=>"http://www.demandware.com/xml/impex/pricebook/2006-10-31" ) do
                xml.pricebook do
                    xml.header({"pricebook-id" => self.pricebook_id }) do
                        xml.currency self.pricebook_currency
                        xml.DisplayName({"xml:lang" => "x-default"}, self.pricebook_id)
                        xml.OnlineFlag true
                    end
                    xml.PriceTables do
                        self.products.each do | product |
                            xml.PriceTable({"product-id" => product["id"]}) do
                                xml.amount({"quantity" => 1}, product["price"])
                            end
                        end
                    end
                end
            end
        end
        File.open( self.pricebook_path + "/#{self.pricebook_id}.xml", 'w') do |file|
            blob = replace_camel b.to_xml
            file.write blob
        end
    end

    def create_inventory
        puts "creating inventory..."
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
        File.open( inventory_path + "/#{self.inventory_id}.xml", 'w') do |file|
            blob = replace_camel b.to_xml
            file.write blob
        end
    end


    def move_output_to_build_suite
        puts "moving output to build-suite directory..."
        Dir.glob("#{self.output_path}/*").each do |directory|
            FileUtils.cp_r directory , self.buildsuite_output_path
        end
    end

    def create_config_json
        puts "creating config json..."
        config = File.read(config_json_path)
        config.gsub!("<%=HOST>",      self.host)
        config.gsub!("<%=USER_NAME>", self.user)
        config.gsub!("<%=PASSWORD>",  self.password)
        File.open( "build-suite/build/config.json", 'w'){|file| file.write config}
    end



    def run_build_suite_catalog_populate
        puts "running catalogPopulate. this could take a while..."
        result =  %x( cd #{Rails.root.to_s + "/build-suite"} && grunt catalogPopulate )
        puts "catalogPopulate complete..."
        return result
    end

    def run_build_suite_rebuild_index
        if self.rebuild_search_index
            puts "rebuilding the search index. this could take a while..."
            result = %x( cd #{Rails.root.to_s + "/build-suite"} && grunt triggerReindex ) # run catalog reindex
            puts "search index rebuild complete..."
        else
            puts "skipping rebuild catalog index///"
        end
        return result || ""
    end

    def send_notification_email result
        if self.email.present? && self.email != ""
            puts "sending notification email..."
            data = {
                :personalizations => [
                    {
                        :to => [ :email => self.email ],
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
    end




    def config_json_path
        return "build-suite-config/config.catalog.json"
    end

    def output_path
        return 'tmp/output'
    end

    def catalog_path
        return "#{self.output_path}/catalogs/#{self.catalog_id}"
    end

    def pricebook_path
        return "#{self.output_path}/pricebooks"
    end


    def inventory_path
        return "#{self.output_path}/inventory-lists"
    end

    def site_path
        return "#{self.output_path}/sites/#{site_id}" if site_id.present?
    end

    def image_path
        return self.catalog_path + "/static/default/images"
    end

    def buildsuite_output_path
        return "build-suite/output/UNNAMED/site_import/cc-demo-creator"
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
