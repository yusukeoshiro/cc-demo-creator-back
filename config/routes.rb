Rails.application.routes.draw do
    match '*path' => 'options_request#preflight', via: :options

    namespace 'api' do
        namespace 'v1' do
            post 'catalog', :to => 'catalog#submit'
            get  'env',     :to => 'misc#env'
            post 'login',   :to => 'sites#login'
            get  'sites',   :to => 'sites#get_sites'


            resources 'sites', only: [:create] do

            end
        end
    end
end
