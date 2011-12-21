require 'bundler/setup'
require 'sinatra'
require 'json'

set :public_folder, File.dirname(__FILE__) + '/public'

# Never return any documents, javascripts or stylesheets - handled by webserver returning static files
get %r{/(documents|javascripts|stylesheets)/.+} do
  halt 404, "404"
end

# Default GET request for new pages.
get '*' do
  content_type :html
  File.read 'public/index.html'
end

# Default POST request - attempts to store the document under 'public/documents/'
post '/documents/*.json' do
  doc = Pathname('public/documents') + Pathname(params[:splat].first + '.md').cleanpath
  exists = doc.exist?

  doc.dirname.mkpath
  doc.open('w') { |f| f.write params[:text] }

  message = (exists ? "Page updated." : "Page created.");

  puts doc.to_s
    
  content_type :json
  { status: "success", message: message}.to_json.to_s
end
