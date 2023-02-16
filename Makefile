.PHONY: build
.DEFAULT_GOAL := build-dev

COMMIT_HASH=`git rev-parse --short HEAD`

build-dev:
	echo "Building trackavault ${COMMIT_HASH}-dev image as latest-dev..."
	docker build --target dev -t trackavault:${COMMIT_HASH}-dev .
	docker tag trackavault:${COMMIT_HASH}-dev trackavault:latest-dev

build-prod:
	echo "Building trackavault ${COMMIT_HASH}-prod image as prod..."
	docker build --target prod -t trackavault:${COMMIT_HASH}-prod .
	docker tag trackavault:${COMMIT_HASH}-prod trackavault:prod

start-dev: stop
	echo "Running trackavault latest-dev..."
	@docker start trackavault-dev || docker run --rm -dit -p 4200:4200 \
		--add-host=host.docker.internal:172.17.0.1 \
		--name trackavault-dev \
		--user $(id -u):$(id -g) \
		-v ${CURDIR}:/usr/src/app \
		trackavault:latest-dev

start-prod: stop
	echo "Running trackavault prod..."
	@docker run --rm -dit \
		-v ${CURDIR}:/usr/src/app \
		trackavault:prod

stop:
	@docker stop trackavault-dev || true
	sleep 5
