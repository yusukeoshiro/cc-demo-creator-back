require 'settings'

module Api
    module V1
        class MiscController < ApplicationController
            def env
                render :json => {
                    "CLOUDINARY_CLOUD_NAME" => Cloudinary.config.cloud_name,
                    "CLOUDINARY_UPLOAD_PRESET" => ENV["CLOUDINARY_UPLOAD_PRESET"],
                    "GOOGLE_IMAGE_API_KEY" => ENV["GOOGLE_IMAGE_API_KEY"],
                    "CURRENCIES" => Settings.currencies
                }
            end
        end

    end
end
