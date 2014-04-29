true_stylesheets_path = File.expand_path(File.join(File.dirname(__FILE__), '..', 'sass'))
begin
  require 'compass'
  Compass::Frameworks.register('true', :stylesheets_directory => true_stylesheets_path)
rescue LoadError
  # compass not found, register on the Sass path via the environment.
  if ENV.key? 'SASS_PATH'
    ENV['SASS_PATH'] += File::PATH_SEPARATOR + true_stylesheets_path
  else
    ENV['SASS_PATH'] = true_stylesheets_path
  end
end
