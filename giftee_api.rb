require 'base64'
require 'net/http'
require 'uri'
require 'json'

# 環境変数から取得する方が安全
access_token = "8db9f9d2-9ea7-4295-a8a0-db9eef54af0b"
basic_auth = Base64.encode64("#{access_token}:")
headers = {
  "Authorization" => "Basic #{basic_auth}",
  "Content-Type" => "application/json; charset=utf-8"
}

# 正しいエンドポイントを指定
uri = URI.parse("https://g4b.giftee.biz/api/gift_cards")
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = true

request = Net::HTTP::Post.new(uri.request_uri, headers)
request.body = {
  gift_card_config_code: "4c431248-f915-4b3c-be52-2f3cd689bf26",
  issue_identity: "4c431248-f915-4b3c-be52-2f3cd689bf26"
}.to_json

begin
    response = http.request(request)
    body_hash = JSON.parse(response.body)
    url = body_hash.dig("gift_card", "url")
rescue => e
    puts "URL抽出エラー: #{e.message}"
end