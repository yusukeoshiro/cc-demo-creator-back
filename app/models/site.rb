class Site
  include ActiveModel::Model

  attr_accessor :host, :user, :password, :site_id, :site_name, :default_locale, :default_currency, :allowed_currencies, :main_color, :logo_url, :email, :rebuild_search_index

  with_options presence: true do
    validates :host
    validates :user
    validates :password
    validates :site_id
    validates :default_locale
    validates :default_currency
    validates :allowed_currencies
  end

  def pre_build
    set_config
    output_copy_sitegenesis_js
  end

  def set_config
    config = File.read('config.site.json')
    config.gsub!("<%=HOST>", host)
    config.gsub!("<%=USER_NAME>", user)
    config.gsub!("<%=PASSWORD>", password)
    config.gsub!("<%=SITEID>", site_id)
    File.open( "build-suite/build/config.json", 'w') { |file| file.write config }
  end

  # example
  # run_build_suite_command { 'siteBuild' }
  def run_build_suite_command
    return unless block_given?

    result = %x("cd #{build_suite_path} && grunt #{yield}")
    add_messages(result)
  end

  def run_build
    puts 'Start grunt siteBuild!'
    result = %x( cd #{build_suite_path} && grunt siteBuild )
    add_messages(result)
  end

  def copy_import_data
    puts 'Start copy site data'
    result = %x( cd #{build_suite_path} && grunt dw_copy )
    add_messages(result)
  end

  def upload_code_and_active
    puts 'Start upload code and active!'
    result = %x( cd #{build_suite_path} && grunt upload && grunt activate )
    add_messages(result)
  end

  def upload_import_data
    puts 'Start upload site data!'
    result = %x( cd #{build_suite_path} && grunt initSite )
    add_messages(result)
  end

  def rebuild_index
    puts 'now rebuilding the search index. this could take a while...'
    result = %x( cd #{build_suite_path} && grunt triggerReindex )
    add_messages(result)
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

  def result_message
    @log_messages.join
  end

  def remove_import_data_dir
    FileUtils.rm_rf(["#{build_suite_path}/exports", "#{build_suite_path}/output"])
  end

  def output_copy_sitegenesis_js
    output_js = <<-"JSON"
      'use strict';

      var fs = require('fs-extra');

      module.exports = function (grunt) {
          grunt.registerMultiTask('dw_copy_sitegenesis', 'Create dir to export the site from storefront at root.', function () {
              var dependencies = grunt.config('dependencies'),
                  checkoutpath = grunt.config('dw_properties').folders.repos + dependencies[0].id;

              grunt.log.writeln(' -- Starting copy to ' + checkoutpath + ' form ../sitegenesis');

              fs.mkdirsSync(checkoutpath);
              fs.copySync('../sitegenesis', checkoutpath);
          });
      };
    JSON

    output_config = <<-"JSON"
      module.exports = {
          options: {
          },
          default: {
          }
      };
    JSON

    File.write('build-suite/grunt/tasks/dw_copy_sitegenesis.js', output_js)
    File.write('build-suite/grunt/config/dw_copy_sitegenesis.js', output_config)
  end

  private

  def build_suite_path
    @build_suite_path ||= "#{Rails.root.to_s}/build-suite"
  end

  def export_sitegenesis_path
    @export_sitegenesis_path ||= "#{build_suite_path}/exports/#{site_id}/sitegenesis"
  end

  def base
    @base ||= "#{export_sitegenesis_path}/demo_data_no_hires_images"
  end

  def dest
    @dest ||= "#{export_sitegenesis_path}/sites/site_template"
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

  def add_messages(message)
    @log_messages ||= []
    @log_messages << message
    puts message
    @log_messages
  end
end
