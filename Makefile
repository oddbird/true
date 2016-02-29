BIN = ./node_modules/.bin


.PHONY: test
test: coverage-clean
	$(BIN)/istanbul cover $(BIN)/_mocha -- -R spec


.PHONY: debug
debug:
	$(BIN)/mocha -R spec debug

.PHONY: compile
compile:
	$(BIN)/node-sass test/scss/test.scss test/css/test.css --include-path ./sass/


.PHONY: coverage-clean
coverage-clean:
	-rm -rf coverage


.PHONY: coverage-html
coverage-html:
	$(BIN)/istanbul report html
