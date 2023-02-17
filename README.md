# Trackavault UI

## Development

### Getting started

- Clone the repository
- `make -s build-dev`
- `make -s start-dev`
- Navigate to `https://localhost:4200`

### Makefile

These are the available targets for make:

- `build-dev`

  Builds the Docker image for the project (see Dockerfile).
  The dev image is basically a Node container that prepares the project (installs dependencies).

- `build-prod`

  Builds the Docker image for the project (see Dockerfile).
  The prod image is basically running `npm run build` on top of the dev image.

- `start-dev`

  Starts a Docker container with the latest dev image.
  The tools needed for development like `npm` or `ng` will be run inside this container.

- `start-prod`

  Starts a Docker container with the prod image.
  The container builds the Angular application and outputs to the `dist/` folder.

- `stop`

  Stops the Docker container
