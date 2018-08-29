require 'open-uri'

module Api
    module V1
        class SitesController < ApplicationController
            def create
                payload = JSON.parse request.body.read
                SiteWorker.perform_async payload
                render :json => {}
            end

            def login
                begin
                    payload = JSON.parse request.body.read
                    o = OcapiClient.new(
                        bm_host_name: payload["host"],
                        bm_user_name: payload["bmUserName"],
                        bm_password:  payload["bmPassword"]
                    )

                    render :json => {
                        "access_token" => o.access_token
                    }
                rescue => e
                    render :json => {
                        "message" => e.message
                        }, :status => :forbidden
                    end
                end

                def get_sites
                    begin
                        host = params[:bm_host_name]
                        access_token = params[:access_token]

                        o = OcapiClient.new(
                            bm_host_name: host,
                            access_token: access_token
                        )

                        render :json => {
                            "result" => o.get_sites
                        }
                    rescue => e
                        render :json => {
                            "message" => e.message
                            }, :status => :forbidden
                        end
                    end


                end
            end
        end
