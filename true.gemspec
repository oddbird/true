# -*- encoding: utf-8 -*-

Gem::Specification.new do |s|
  # General Project Information
  s.name = "true"
  s.version = "0.1.2"
  s.date = "2013-06-06"

  # RubyForge Information
  s.rubyforge_project = "true"
  s.rubygems_version = "1.8.24"
  s.required_rubygems_version = Gem::Requirement.new(">= 1.2") if s.respond_to? :required_rubygems_version=

  # Author Information
  s.authors = ["Eric Meyer"]
  s.email = ["eric@oddbird.net"]
  s.homepage = "http://oddbird.net/"

  # Project Description
  s.summary = "Testing framework for compass and sass libraries."
  s.description = "A framework to help you develop and manage compass/sass libraries with a test-driven approach."

  # Files to Include
  s.require_paths = ["lib"]

  s.files = Dir.glob("lib/*.*")
  s.files += Dir.glob("sass/**/*.*")
  s.files += ["CHANGELOG.md", "LICENSE.txt", "README.md"]

  # Docs Information
  s.extra_rdoc_files = ["CHANGELOG.md", "LICENSE.txt", "README.md", "lib/true.rb"]
  s.rdoc_options = ["--line-numbers", "--inline-source", "--title", "true", "--main", "README.md"]

  # Project Dependencies
  if s.respond_to? :specification_version then
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
      s.add_runtime_dependency(%q<compass>,       [">= 0.12.2"])
      s.add_runtime_dependency(%q<sass>,          [">= 3.2.0"])
    else
      s.add_dependency(%q<compass>,       [">= 0.12.2"])
      s.add_dependency(%q<sass>,          [">= 3.2.0"])
    end
  else
    s.add_dependency(%q<compass>,       [">= 0.12.2"])
    s.add_dependency(%q<sass>,          [">= 3.2.0"])
  end
end
