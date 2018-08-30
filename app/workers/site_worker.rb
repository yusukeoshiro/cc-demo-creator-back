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
      logo_url: payload['siteDetail']['brandLogoUrl'],
      email: payload['siteDetail']['email'],
      rebuild_search_index: payload['siteDetail']['isRebuildSearchIndex']
    )

    raise 'invalid parameter!' if !site.valid?

    site.pre_build
    site.run_build
    site.create_import_data
    site.copy_import_data
    site.upload_code_and_active
    site.upload_import_data
    site.rebuild_index if site.rebuild_search_index
    site.remove_import_data_dir

    if site.email.present? && ENV['SENDGRID_API_KEY']
      data = {
        :personalizations => [
          {
            :to => [ :email => site.email ],
            :subject => 'cc demo creator - build result: ' + DateTime.now.to_s
          }
        ],
        :from => {
          :email => "noreply@ccdemocreator.io"
        },
        :content => [
          {
            :type => "text/plain",
            :value => site.result_message
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

    puts 'End site worker!'

  rescue => e
    puts 'Site worker error!'
    puts e
  end
end
