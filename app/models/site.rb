class Site
  include ActiveModel::Model

  attr_accessor :host, :user, :password, :site_id, :site_name, :default_locale, :default_currency, :allowed_currencies, :main_color, :logo_url

  with_options presence: true do
    validates :host
    validates :user
    validates :password
    validates :site_id
    validates :default_locale
    validates :default_currency
    validates :allowed_currencies
  end

  def set_config 
    config = File.read('config.json')
    config.gsub!("<%=HOST>", host)
    config.gsub!("<%=USER_NAME>", user)
    config.gsub!("<%=PASSWORD>", password)
    config.gsub!("<%=SITEID>", site_id)
    # config.gsub!("<%=SITENAME>", site_name)
    File.open( "build-suite/build/config.json", 'w') { |file| file.write config }
  end

  def run_build
    result = %x( cd #{Rails.root.to_s}/build-suite && grunt build )
    puts result
  end

  def copy_import_data 
    result = %x( cd #{Rails.root.to_s}/build-suite && grunt dw_copy )
    puts result
  end

  def upload_code_and_active
    result = %x( cd #{Rails.root.to_s}/build-suite && grunt upload && grunt activate )
    puts result
  end

  def upload_import_data
    result = %x( cd #{Rails.root.to_s}/build-suite && grunt initSite )
    puts result
  end

  def create_import_data
    FileUtils.mkdir_p([dest, dest_sites, dest_custom_object, dest_libraries, dest_meta])
    FileUtils.mv(Dir.glob(base_custom_object), dest_custom_object)
    FileUtils.mv(Dir.glob(base_meta), dest_meta)
    FileUtils.mv(Dir.glob(base_libraries), dest_libraries)
    FileUtils.mv(Dir.glob(base_sites), dest_sites)
    
    replace_shared_library
    replace_site
    replace_preferences
  end

  def replace_shared_library
    l = Nokogiri::XML(File.read(dest_libraries + '/library.xml'))
    l.search('library').first['library-id'] = site_id + 'SharedLibrary'
    File.write(dest_libraries + '/library.xml', l.to_xml)
  end

  def replace_site
    l = Nokogiri::XML(File.read(dest_sites + '/site.xml'))
    l.search('site').first['site-id'] = site_id
    l.search('name').first.content = site_name
    # l.search('custom-cartridges').first.content = Dir.glob(s).first.split('/').last
    l.search('custom-cartridges').first.content = 'app_storefront_controllers:app_storefront_core'
    l.search('currency').first.content = default_currency
    File.write(dest_sites + '/site.xml', l.to_xml)
  end

  def replace_preferences
    l = Nokogiri::XML(File.read(dest_sites + '/preferences.xml'))
    l.css('preference[preference-id="SiteCustomerList"]').first.content = site_id
    l.css('preference[preference-id="SiteCurrencies"]').first.content = allowed_currencies
    l.css('preference[preference-id="SiteLibrary"]').first.content = site_id + 'SharedLibrary'
    l.css('preference[preference-id="SiteDefaultLocale"]').first.content = default_locale
    # l.css('preference[preference-id="SiteLocales"]').first.content = "default:#{default_locale}"
    File.write(dest_sites + '/preferences.xml', l.to_xml)
  end

  def replace_css
    css = File.read(css_path)
    css.gsub!(/^\$citrus:\ #84bd00;$/, "$citrus: #{main_color}")
    File.write(css_path, css)
  end

  private

  def build_suite_path
    @build_suite_path ||= "#{Rails.root.to_s}/build-suite/exports/#{site_id}/sitegenesis"
  end

  def base
    @base ||= "#{build_suite_path}/demo_data_no_hires_images"
  end

  def dest
    @dest ||= "#{build_suite_path}/sites/site_template"
  end

  def base_custom_object
    "#{base}/custom-object/*"
  end

  def base_meta
    "#{base}/meta/*"
  end

  def base_libraries
    "#{base}/libraries/SiteGenesisSharedLibrary/*"
  end

  def base_libraries
    "#{base}/libraries/SiteGenesisSharedLibrary/*"
  end

  def base_sites
    "#{base}/sites/SiteGenesis/*"
  end

  def dest_sites
    "#{dest}/sites/#{site_id}"
  end

  def dest_custom_object
    "#{dest}/custom-object"
  end

  def dest_libraries
    "#{dest}/libraries/#{site_id}SharedLibrary"
  end

  def dest_meta
    "#{dest}/meta"
  end

  def css_path
    "#{build_suite_path}/app_storefront_core/cartridge/scss/default/_variables.scss"
  end
end
