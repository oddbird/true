begin
  require 'compass'
  Compass::Frameworks.register('true',
    :stylesheets_directory => File.expand_path(File.join(File.dirname(__FILE__), '..', 'sass')))
rescue LoadError
  # compass not found, don't register with it.
end
