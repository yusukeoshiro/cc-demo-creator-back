module Api
    module V1
        class CatalogController < ApplicationController
            def submit
                payload = JSON.parse request.body.read
                CatalogWorker.perform_async payload
                render :json => {}
            end
        end

    end
end
