require 'byebug'

class SiteWorker
  include Sidekiq::Worker

  def perform(payload)
    puts 'Start site worker!'

    site = Site.new(
      host: payload['instanceDetail']['host'],
      user: payload['instanceDetail']['bmUserName'],
      password: payload['instanceDetail']['bmPassword'],
      site_id: payload['siteDetail']['id'],
      site_name: payload['siteDetail']['name'],
      default_locale: payload['siteDetail']['defualtLocale'],
      default_currency: payload['siteDetail']['defaultCurrency'],
      allowed_currencies: payload['siteDetail']['allowedCurrencies'],
      main_color: payload['siteDetail']['mainColor'],
      logo_url: payload['siteDetail']['brandLogoUrl']
    )

    return if !site.valid?

    # following is not good bacause it need to keep order
    # will refactoring
    site.set_config
    site.run_build
    site.create_import_data
    site.copy_import_data
    site.upload_code_and_active
    site.upload_import_data
    
    puts 'End site worker!'

  rescue => e
    puts e
  end
end
