require 'bundler/setup'

SOURCES = Dir["src/js/*.js"]

namespace :juicer do
  desc 'Initial setup'
  task :setup do
    sh 'juicer install'
  end

  desc 'Merges stylesheets'
  task :css => :"juicer:js" do
    src = ['src/css/browser.css',
           'src/css/universal.css',
           'src/css/ace-twilight.css',
           'src/css/sprites.css']

    # Create CSS with embedded images
    sh 'juicer merge -e data_uri -f -d src -o public/stylesheets/browser.css ' + src.join(' ')
  end

  desc 'Merges JavaScripts'
  task :js do
    ace_dir = "vendor/ace/build/src"
    ace_extras = Dir["#{ace_dir}/{mode,theme}-*"]

    # Ace editor + themes and modes
    copy_raw = ["#{ace_dir}/ace-uncompressed.js"] + ace_extras
    copy_min = ["#{ace_dir}/ace.js"] + ace_extras

    # jQuery UI
    copy_raw << "vendor/jquery-ui-1.8.16.custom.min.js" # missing unminify'ed version
    copy_min << "vendor/jquery-ui-1.8.16.custom.min.js"

    # jQuery event drag
    copy_raw << "vendor/jquery.event.drag-2.0.min.js" # missing unminify'ed version
    copy_min << "vendor/jquery.event.drag-2.0.min.js"

    # Source to minify
    minify = ["vendor/quickdiff/quickdiff.js",
              "vendor/mdext/src/showdown.js",
              "vendor/store.js/json.js",
              "vendor/store.js/store.js"
             ] + SOURCES

    File.open('public/javascripts/browser-uncompressed.js', 'w') do |file|
      (copy_raw + minify).each { |c| file.write ";\n#{File.read(c)};\n" }
    end

    sh 'juicer merge -s -i -f -o public/javascripts/browser-tmp.js ' + minify.join(' ')
    File.open('public/javascripts/browser.js', 'w') do |file|
      copy_min.each { |c| file.write ";\n#{File.read(c)};\n" }
      file.write File.read('public/javascripts/browser-tmp.js')
    end
    File.unlink('public/javascripts/browser-tmp.js')
  end

  desc 'Verify'
  task :verify do
    minify = Dir["src/js/*.js"]
    sh 'juicer verify ' + SOURCES.join(' ')
  end
end
