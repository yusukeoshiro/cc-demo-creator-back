namespace :dev do



    task :test => :environment do

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



        b = Nokogiri::XML::Builder.new do |xml|
            xml.catalog("xmlns"=>"http://www.demandware.com/xml/impex/catalog/2006-10-31", "catalog-id"=>"REPLACE") do
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

                        xml.VariationAttributeId = "color"
                        xml.AltPattern "${productname}, ${variationvalue}, ${viewtype}"
                        xml.TitlePattern "${productname}, ${variationvalue}"
                    end
                end

                # repeat for categories
                xml.category("category-id" => "REPLACE") do
                    xml.DisplayName({"xml:lang"=>"x-default"}, "REPLACE")
                    xml.OnlineFlag true
                    xml.Parent "REPLACE"
                    xml.template
                    xml.PageAttributes
                    xml.AttributeGroups do
                        xml.AttributeGroup("group-id" => "REPLACE") do
                            xml.DisplayName({"xml:lang"=>"x-default"}, "REPLACE")
                            xml.attribute("attribute-id"=>"REPLACE", "system"=>false)
                        end
                    end
                end

                # repeat for products
                xml.product("product-id" => "REPLACE") do
                    xml.ean
                    xml.unit
                    xml.MinOrderQuantity 1
                    xml.OnlineFlag true
                    xml.OnlineFrom (DateTime.now - 90).strftime("%FT%T%:z")
                    xml.AvailableFlag true
                    xml.SearchableFlag true
                    xml.TaxClassId "REPLACE"
                    xml.PageAttributes
                    xml.CustomAttributes do
                        xml.CustomAttribute({"attribute-id" => "REPLACE"}, "REPLACE")
                    end

                    xml.images do
                        xml.ImageGroup("view-type" => "large") do
                            xml.image("path" => "REPLACE")
                        end
                        xml.ImageGroup("view-type" => "medium") do
                            xml.image("path" => "REPLACE")
                        end
                        xml.ImageGroup("view-type" => "small") do
                            xml.image("path" => "REPLACE")
                        end
                    end
                end

                # repeat for category assignments
                xml.CategoryAssignment("category-id"=>"REPLACE", "product-id"=>"REPLACE") do
                    xml.PrimaryFlag true
                end

            end
        end

        puts replace_camel (b.to_xml)

    end


    def replace_camel input
        replacements = %w( ImageSettings InternalLocation ViewTypes ViewType
            VariationAttributeId AltPattern TitlePattern Parent
            DisplayName PageAttributes AttributeGroups AttributeGroup
            CustomAttributes CustomAttribute ImageGroup TaxClassId SearchableFlag AvailableFlag OnlineFrom OnlineFlag MinOrderQuantity
            CategoryAssignment PrimaryFlag)
        replacements.each do |replacement|
            input.gsub!(replacement, replacement.to_kebab)
        end
        return input
    end

end
