SHELL = /bin/bash
SHELLFLAGS = -ex
.EXPORT_ALL_VARIABLES:
ENVIRONMENT = $(shell aws ssm get-parameter --name '/pcpt/stage' --query Parameter.Value --output text)
APPNAME ?= orchestration-api
VERSION ?= $(shell git rev-parse --short HEAD)
PACKAGE ?= package-$(VERSION).zip
GIT_BRANCH ?= $(shell git rev-parse --abbrev-ref HEAD)
COMMIT_HASH ?= $(shell git rev-parse --short HEAD)
## Valid matches mainline branch
ifeq (master,$(GIT_BRANCH))
$(info [+] Branch ($(GIT_BRANCH)) matches master)
$(info [+] would deploy as mainline)
STACK_NAME = $(APPNAME)
## If running in BuildKite
else
$(info [+] GIT_BRANCH is defined as $(GIT_BRANCH))
$(info [+] assume deployed is feature)
STACK_NAME = $(APPNAME)-$(GIT_BRANCH)
endif
# Import settings and stage-specific overrides
include ./settings/defaults.conf
ifneq ("$(wildcard ./settings/$(ENVIRONMENT).conf"), "")
-include ./settings/$(ENVIRONMENT).conf
endif
ifdef TAG
$(info $$(TAG) set - $(TAG))
$(info [+] would deploy as mainline)
STACK_NAME = $(APPNAME)
endif
help: ## Get help about Makefile commands
    @grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(firstword $(MAKEFILE_LIST)) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help
test: ## Run the tests
    npm test
.PHONY: test
clean: ## clean all the generated files and folders
    @rm -f ./package*.zip
    @rm -f ./handler.zip
    @rm -rf ./coverage
    @rm -rf ./dist
    @rm -rf ./package
    @rm -rf ./cdk.out
.PHONY: clean
ci-build: clean install install-dev build lint ## clean, install dependencies, build the app, run lint
.PHONY: ci-build
install: ## install node modules
    npm install
.PHONY: install
install-dev: ## install python dev packages
    pipenv install --dev
.PHONY: install-dev
build: ## Compile Typescript into JS
    npm run build
.PHONY: build
lint: ## Run linting of Typescript and Yaml files
    npm run lint
.PHONY: lint
ci-unit-test: clean install build test ## install dependencies, run tests
.PHONY: ci-unit-test
deploy: ## Deploy CDK app stack
    npm run cdk deploy
.PHONY: deploy
cdk-synth: ## Print the CFN for the stack
    npm run cdk synth
.PHONY: cdk-synth
cdk-diff: ## Compare with the deployed stack
    npm run cdk diff
.PHONY: cdk-diff
cdk-list: ## List all stacks
    npm run cdk list
.PHONY: cdk-list
package: clean ## packages the app into a ZIP file for deploying from pipeline
    docker-compose -f docker-compose.yml -f docker-compose-prod.yml up --build --exit-code-from orch-api-package && \
    docker-compose -f docker-compose.yml -f docker-compose-prod.yml down && \
    cp package/*.zip .
.PHONY: package
package-local: clean ## packages the app into a ZIP file for deploying from local
    docker-compose up --build --exit-code-from orch-api-package && \
    docker-compose down && \
    cp package/*.zip .
.PHONY: package-local
release: install-dev ## publishes the app to the SNS promoter topic
    echo "Notifying promoter of new release: $(PACKAGE)"
    aws sns publish --topic-arn $(ARTIFACTS_NOTIFY_TOPIC_ARN) \
        --message '$(shell pipenv run python -c 'from pcpt_utility.helper import create_payload; print(create_payload(shell_safe=True))')'
.PHONY: release
bootstrap: ## Deploy CDK toolkit stack
    npm run cdk bootstrap
.PHONY: bootstrap
deploy-all: bootstrap deploy ## Deploy CDK toolkit stack and app stack
.PHONY: deploy-all
update-customers: ## Update GS2PK, GS2SK, GS3PK & GS3SK attributes for existing Customers in Global Customer DDB Table
    $(eval export CUSTOMER_TABLE_NAME=$(shell aws ssm get-parameter --name '/pcpt/orch-api/infra/ddb/customer/tablename' --query Parameter.Value --output text))
    $(eval export DDB_ACCESS_ROLE_ARN=$(shell aws ssm get-parameter --name '/pcpt/orch-api/infra/ddb/iam/accessrole' --query Parameter.Value --output text))
    npm run update-customers
.PHONY: update-customers