class ApplicationController < ActionController::API
    before_action :add_cors_headers

    def add_cors_headers
        headers['Access-Control-Allow-Origin'] = '*'
    end
end
