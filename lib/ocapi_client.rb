class OcapiClient
    attr_accessor :bm_host_name, :bm_user_name, :bm_password, :bm_client_id, :access_token

    def initialize(**kwargs)

        if kwargs[:access_token].present?
            self.bm_host_name = kwargs[:bm_host_name]
            self.access_token = kwargs[:access_token]
            return

        else
            self.bm_host_name = kwargs[:bm_host_name]
            self.bm_user_name = kwargs[:bm_user_name]
            self.bm_password = kwargs[:bm_password]
            self.bm_client_id = kwargs[:bm_client_id] || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        end




        auth = Base64.encode64( "#{self.bm_user_name}:#{self.bm_password}:#{self.bm_client_id}" ).delete("\n")

        url = "https://#{self.bm_host_name}/dw/oauth2/access_token?client_id=#{bm_client_id}"
        uri = URI.parse( URI.encode url )
		https = Net::HTTP.new(uri.host, uri.port)
        header = {
            "Authorization" => "Basic #{auth}",
            "content-type" => "application/x-www-form-urlencoded"
        }
        param = "grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken"

		https.use_ssl = true
		https.verify_mode = OpenSSL::SSL::VERIFY_PEER
		res = https.post( uri.request_uri, param, header )

        if res.code == "200"
            body = JSON.parse res.body
            if body["access_token"]
                self.access_token = body["access_token"]
            else
                raise res.body
            end
        else
            raise res.body
        end

    end


    def get_sites
        url = "https://#{self.bm_host_name}/s/-/dw/data/v18_8/sites?client_id=#{self.bm_client_id}"
        uri = URI.parse(URI.encode url)
		https = Net::HTTP.new(uri.host, uri.port)
		https.use_ssl = true
		req = Net::HTTP::Get.new(uri.request_uri)
		req["authorization"] = "Bearer #{self.access_token}"
		res = https.request(req)

		if res.code == "200"
			return JSON.parse res.body
		else
			raise res.body
		end
    end

end
