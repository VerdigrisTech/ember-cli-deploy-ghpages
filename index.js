/* jshint node: true */
'use strict';

var denodeify = require('denodeify');
var fs = require('fs-extra');
var ensureDir = denodeify(fs.ensureDir);
var copy = denodeify(fs.copy);
var path = require('path');
var git = require('gift');

var Promise = require('rsvp').Promise;

var DeployPluginBase = require('ember-cli-deploy-plugin');

module.exports = {
  name: 'ember-cli-deploy-ghpages',

  createDeployPlugin(options) {
    /**
     * Private function for creating an orphan branch that does not have any
     * parents.
     *
     * @params {Repo} repository
     * @params {String} branch
     * @return {Promise}
     */
    function createOrphanBranch(repository, branch) {
      return new Promise((resolve, reject) => {
        repository.git('checkout', { orphan: true }, branch, (error, b) => {
          if (error) {
            return reject(error);
          }

          return resolve(b);
        });
      });
    }

    /**
     * Private function to delete a branch.
     *
     * @params {Repo} repository
     * @params {String} branch
     * @return {Promise}
     */
    function deleteBranch(repository, branch) {
      return new Promise((resolve, reject) => {
        repository.git('branch', { D: true }, branch, error => {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    /**
     * Private function for checking whether a branch exists.
     *
     * @params {Repo} repository
     * @params {String} branch
     * @return {Promise}
     */
    function branchExists(repository, branch) {
      return new Promise((resolve, reject) => {
        repository.branch(branch, (error) => {
          if (error) {
            return reject();
          }

          return resolve();
        });
      });
    }

    /**
     * Private function for deleting all files.
     *
     * @params {Repo} repository
     * @return {Promise}
     */
    function removeAll(repository) {
      return new Promise((resolve, reject) => {
        repository.remove('.', { r: true, f: true }, (error, output) => {
          if (error) {
            return reject(error);
          }

          return resolve(output);
        });
      });
    }

    /**
     * Private function for creating empty commits.
     *
     * @params {Repo} repository
     * @return {Promise}
     */
    function commitEmpty(repository, message) {
      return new Promise((resolve, reject) => {
        repository.commit(message, { 'allow-empty': true }, error => {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    var GHPagesPlugin = DeployPluginBase.extend({
      name: options.name,

      defaultConfig: {
        branch: 'gh-pages'
      },

      setup: function (context) {
        let repo;
        let self = this;
        let branch = this.readConfig('branch');
        let projectTmpPath = path.resolve(context.project.root, 'tmp');
        let repoTmpPath = path.resolve(projectTmpPath, 'gh-pages');

        return ensureDir(path.resolve(context.project.root, repoTmpPath))
          .then(function () {
            self.log('cloning project repository to tmp');

            return copy(context.project.root, repoTmpPath, {
              filter: function (path) {
                // If you recursively copy the tmp directory, you'll have a bad
                // time.
                return path !== projectTmpPath;
              }
            });
          })
          .then(function () {
            self.log('cloned project repository to tmp', { color: 'green' });

            repo = git(repoTmpPath);

            return branchExists(repo, branch);
          })
          .then(function () {
            self.log(`branch '${branch}' already exists`, { color: 'yellow' });

            return deleteBranch(repo, branch)
              .then(function () {
                return createOrphanBranch(repo, branch);
              });
          }, function () {
            return createOrphanBranch(repo, branch);
          })
          .then(function () {
            self.log(`successfully checked out '${branch}' branch`, {
              color: 'green'
            });
            self.log('removing all files');

            return removeAll(repo);
          })
          .then(function () {
            self.log(`all files removed on '${branch}' branch`, {
              color: 'green'
            });
          })
          .catch(function (error) {
            this.log(error, { color: 'red' });
          });
      },

      didBuild: function (context) {
        console.log("Did build");
        console.log(this.repository);
      },

      upload: function (context) {
      },

      teardown: function (context) {
      }
    });

    return new GHPagesPlugin();
  }
};
