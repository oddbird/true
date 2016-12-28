require 'rubygems/package_task'

task :default => :test

spec = eval(File.read("true.gemspec"), binding, "true.gemspec")

def spec.bump!
  segments = version.to_s.split(".")
  segments[-1] = segments.last.succ
  self.version = Gem::Version.new(segments.join("."))
end

# Set SAME_VERSION when moving to a new major version and you want to specify the new version
# explicitly instead of bumping the current version.
# E.g. rake build SAME_VERSION=true
spec.bump! unless ENV["SAME_VERSION"]

desc "Run tests and build true-#{spec.version}.gem"
task :build => [:test, :gem]

desc "Make make the prebuilt gem true-#{spec.version}.gem public."
task :publish => [:record_version, :push_gem, :tag]

desc "Build & Publish version #{spec.version}"
task :release => [:build, :publish]

Gem::PackageTask.new(spec) do |pkg|
  pkg.need_zip = true
  pkg.need_tar = true
end

desc "run the tests"
task :test do
  sh "bundle exec true-cli test/scss/test.scss", :verbose => false
end

desc "Record the new version in version control for posterity"
task :record_version do
  unless ENV["SAME_VERSION"]
    open(FileList["VERSION"].first, "w") do |f|
      f.write(spec.version.to_s)
    end
    sh "git add --all"
    sh %Q{git commit -m "Bump version to #{spec.version}."}
  end
end

desc "Tag the repo as #{spec.version} and push the code and tag."
task :tag do
  sh "git tag -a -m 'Version #{spec.version}' #{spec.version}"
  sh "git push --tags origin #{`git rev-parse --abbrev-ref HEAD`}"
end

desc "Push true-#{spec.version}.gem to the rubygems server"
task :push_gem do
  sh "gem push pkg/true-#{spec.version}.gem"
end
