Rails.application.routes.draw do
    match '*path' => 'options_request#preflight', via: :options

    namespace 'api' do
        namespace 'v1' do
            post 'catalog', :to => 'catalog#submit'
            get  'env',     :to => 'misc#env'
            post 'login',   :to => 'site#login'
            get  'sites',   :to => 'site#get_sites'
        end

    end

end
