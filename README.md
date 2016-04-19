# ember-cli-deploy-ghpages

> An ember-cli-deploy-plugin to upload to GitHub pages.

![Build](https://img.shields.io/travis/VerdigrisTech/ember-cli-deploy-ghpages.svg)

This plugin uploads your built Ember dist files to GitHub pages.

## Getting Started

To quickly get started with this plugin, follow the steps below:

* Ensure [ember-cli-deploy-build](https://github.com/zapnito/ember-cli-deploy-build)
  is installed.
* Install this plugin.
  ```bash
  $ ember install ember-cli-deploy-ghpages
  ```
* Run the pipeline.
  ```bash
  $ ember deploy
  ```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please
refer to the [Plugin Documentation](http://ember-cli.github.io/ember-cli-deploy/plugins).

* `setup`
* `didBuild`
* `upload`

## Running Tests

* `npm test`
