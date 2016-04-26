# ember-cli-deploy-ghpages [![Build](https://img.shields.io/circleci/project/VerdigrisTech/ember-cli-deploy-ghpages/master.svg)](https://circleci.com/gh/VerdigrisTech/ember-cli-deploy-ghpages) [![Coverage](https://img.shields.io/codecov/c/github/VerdigrisTech/ember-cli-deploy-ghpages/master.svg)](https://codecov.io/gh/VerdigrisTech/ember-cli-deploy-ghpages)

> An ember-cli-deploy-plugin to upload to GitHub pages.

![ember-cli-deploy 0.5.0+](https://ember-cli-deploy.github.io/ember-cli-deploy-version-badges/plugins/ember-cli-deploy-ghpages.svg)

This plugin uploads your built Ember dist files to GitHub pages.

## Getting Started

To quickly get started with this plugin, follow the steps below:

* Ensure [ember-cli-deploy-build](https://github.com/zapnito/ember-cli-deploy-build)
  is installed.
* Install this plugin.

  ```bash
  $ ember install ember-cli-deploy-ghpages
  ```
* Place the following configuration into `config/deploy.js`.

  ```javascript
  ENV.ghpages = {
    gitRemoteUrl: '<your-github-repository-url>'
  }
  ```
* Run the pipeline.

  ```bash
  $ ember deploy
  ```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please
refer to the [Plugin Documentation](http://ember-cli-deploy.github.io/ember-cli-deploy/docs/v0.6.x/plugins-overview).

* `setup`
* `didBuild`
* `willUpload`
* `upload`
* `teardown`

## Configuration Options

For more information on how to configure plugins, refer to the
[Plugin Documentation](http://ember-cli-deploy.github.io/ember-cli-deploy/docs/v0.6.x/configuration-overview/).

### gitRemoteUrl (`required`)

The URL that corresponds to your GitHub repository. The plugin will push the
built dist files to the `gh-pages` branch on this repository.

_Default:_ `undefined`

### domain

Custom domain name of your project site. For more information on how to set up
custom domain for your project site, refer to [GitHub](https://help.github.com/articles/using-a-custom-domain-with-github-pages/)
documentation.

_Default:_ `undefined`

## Running Tests

* `npm test`

## License

This software is distributed AS IS WITHOUT WARRANTY under [Simplified BSD](https://raw.githubusercontent.com/VerdigrisTech/green-button-data/master/LICENSE.md)
license.

Verdigris Technologies Inc. assumes NO RESPONSIBILITY OR LIABILITY
UNDER ANY CIRCUMSTANCES for usage of this software. See the [LICENSE.md](https://raw.githubusercontent.com/VerdigrisTech/green-button-data/master/LICENSE.md)
file for detailed legal information.

Copyright © 2016, [Verdigris Technologies Inc](http://verdigris.co). All rights reserved.
