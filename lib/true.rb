true_stylesheets_path = File.expand_path(File.join(File.dirname(__FILE__), '..', 'sass'))
ENV['SASS_PATH'] ||= ''
begin
  require 'compass'
  ENV['SASS_PATH'] = ENV['SASS_PATH'] + File::PATH_SEPARATOR + Compass.configuration.sass_load_paths.join(File::PATH_SEPARATOR)
rescue LoadError
end
# compass not found, register on the Sass path via the environment.
ENV['SASS_PATH'] += File::PATH_SEPARATOR + true_stylesheets_path
