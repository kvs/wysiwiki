# -*- mode: ruby; indent-tabs-mode: nil; tab-width: 2 -*-

require 'guard/guard'

module ::Guard
  class Rake < ::Guard::Guard
    def run_all
      system "rake juicer:js"
    end

    def run_on_change(paths)
      run_all
    end
  end
end

guard 'bundler' do
  watch('Gemfile')
  # Uncomment next line if Gemfile contain `gemspec' command
  # watch(/^.+\.gemspec/)
end

guard 'rake' do
  watch(%r{^src/js/.+$})
end
