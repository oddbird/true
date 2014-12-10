BIN = ./node_modules/.bin


.PHONY: test
test:
	$(BIN)/mocha -R spec


lib-cov: clean-coverage
	$(BIN)/istanbul instrument --output lib-cov --no-compact --variable global.__coverage__ lib


.PHONY: coverage
coverage: lib-cov
	COVER=1 $(BIN)/mocha -R mocha-istanbul
	@echo
	@echo Open html-report/index.html file in your browser


.PHONY: clean
clean: clean-coverage


.PHONY: clean-coverage
clean-coverage:
	-rm -rf lib-cov
	-rm -rf html-report
