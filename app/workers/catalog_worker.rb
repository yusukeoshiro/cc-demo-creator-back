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
        catalog_id = payload["catalog"]["id"]
        catalog_name = payload["catalog"]["name"]
        bm_user_name = payload["catalog"]["bmUserName"]
        bm_password = payload["catalog"]["bmPassword"]

        categories = payload["catalog"]["categories"]
        images = payload["catalog"]["images"]
        products = payload["catalog"]["products"]

        FileUtils.rm_rf('tmp/output')
        catalog_path = "tmp/output/catalogs/#{catalog_id}"


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
                    # xml.AttributeGroups do
                    #     xml.AttributeGroup("group-id" => "REPLACE") do
                    #         xml.DisplayName({"xml:lang"=>"x-default"}, "REPLACE")
                    #         xml.attribute("attribute-id"=>"REPLACE", "system"=>false)
                    #     end
                    # end
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


    def replace_camel input
        replacements = %w( ImageSettings InternalLocation ViewTypes ViewType
            VariationAttributeId AltPattern TitlePattern Parent
            DisplayName PageAttributes AttributeGroups AttributeGroup
            CustomAttributes CustomAttribute ImageGroup TaxClassId SearchableFlag AvailableFlag OnlineFrom OnlineFlag MinOrderQuantity
            CategoryAssignment PrimaryFlag ClassificationCategory PinterestEnabledFlag FacebookEnabledFlag
            StepQuantity ManufacturerName ManufacturerSku)
        replacements.each do |replacement|
            input.gsub!(replacement, replacement.to_kebab)
        end
        return input
    end

end
