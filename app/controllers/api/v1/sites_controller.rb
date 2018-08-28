require 'open-uri'

module Api
  module V1
    class SitesController < ApplicationController
      def create
        payload = JSON.parse request.body.read
        SiteWorker.perform_async payload
        render :json => {}
      end
    end
  end
end
