Rails.application.routes.draw do
    match '*path' => 'options_request#preflight', via: :options

    namespace 'api' do
        namespace 'v1' do
            post 'catalog', :to => "catalog#submit"
        end
    end

end
