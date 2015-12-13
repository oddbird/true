# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  # General Project Information
  s.name = "true"
  s.version = File.read(File.join(File.dirname(__FILE__), "VERSION"))
  s.date = "2013-10-22"

  # RubyForge Information
  s.rubyforge_project = "true"
  s.rubygems_version = "2.0.3"
  s.required_rubygems_version = Gem::Requirement.new(">= 1.2") if s.respond_to? :required_rubygems_version=

  # Author Information
  s.authors = ["Miriam Eric Suzanne", "Scott Davis", "Chris Eppstein"]
  s.email = ["miriam@oddbird.net", "me@sdavis.info", "chris@eppsteins.net"]
  s.homepage = "http://oddbird.net/true"

  # Project Description
  s.summary = "Testing framework for Sass libraries."
  s.description = "Unit tests for maintaining test-driven Sass libraries."

  # Files to Include
  s.require_paths = ["lib"]

  s.files = Dir.glob("lib/*.*")
  s.files += Dir.glob("sass/**/*.*")
  s.files += ["CHANGELOG.md", "LICENSE.txt", "README.md", "VERSION"]

  s.executables   = ['true-cli']

  # Docs Information
  s.extra_rdoc_files = ["CHANGELOG.md", "LICENSE.txt", "README.md", "lib/true.rb"]
  s.rdoc_options = ["--line-numbers", "--inline-source", "--title", "true", "--main", "README.md"]

  dependencies = {
    "sass"    => ["~> 3.4"]
  }
  # Project Dependencies
  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      dependencies.each do |project, version|
        s.add_runtime_dependency(project, *version)
      end
    else
      dependencies.each do |project, version|
        s.add_dependency(project, *version)
      end
    end
  else
    dependencies.each do |project, version|
      s.add_dependency(project, *version)
    end
  end
end
