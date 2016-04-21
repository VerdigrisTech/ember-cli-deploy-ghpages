/* jshint node: true */
'use strict';

var denodeify = require('denodeify');
var fs = require('fs-extra');
var ensureDir = denodeify(fs.ensureDir);
var copy = denodeify(fs.copy);
var path = require('path');
var git = require('gift');

var RSVP = require('rsvp');
var Promise = RSVP.Promise;

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
     * Private function for copying dist files to tmp directory.
     *
     * @params {String} srcDir
     * @params {Array} srcFiles
     * @params {String} dstDir
     * @return {Promise}
     */
    function copyDistFiles(srcDir, srcFiles, dstDir) {
      return RSVP.all(srcFiles.map(file => copy(
        path.resolve(srcDir, file),
        path.resolve(dstDir, file)
      )));
    }

    /**
     * Private function for staging all files to the repo.
     *
     * @params {Repo} repository
     * @returns {Promise}
     */
    function stageAllFiles(repository) {
      return new Promise((resolve, reject) => {
        repository.add('.', error => {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    /**
     * Private function for commiting.
     *
     * @params {Repo} repository
     * @return {Promise}
     */
    function commit(repository, message) {
      return new Promise((resolve, reject) => {
        repository.commit(message, error => {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    /**
     * Private function for adding remote repo.
     *
     * @params {Repo} repository
     * @params {String} remoteUrl
     * @return {Promise}
     */
    function addRemote(repository, remoteName, remoteUrl) {
      return new Promise((resolve, reject) => {
        repository.remote_add(remoteName, remoteUrl, error => {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    /**
     * Private function for setting upstream for a branch.
     *
     * @params {Repo} repository
     * @params {String} branch
     * @params {String} remoteName
     * @return {Promise}
     */
    function setUpstream(repository, branch, remoteName) {
      return new Promise((resolve, reject) => {
        let remoteBranch = `${remoteName}/${branch}`;

        repository.git('branch', { u: true }, [remoteBranch, branch], error => {
          if (error) {
            return reject(error);
          }

          return resolve();
        });
      });
    }

    /**
     * Private function for pushing to upstream branch.
     *
     * @params {Repo} repository
     * @params {String} branch
     * @params {String} remote
     * @params {Boolean} setUpstream
     * @return {Promise}
     */
    function pushUpstream(repository, branch, remote, setUpstream) {
      return new Promise((resolve, reject) => {
        repository.git('push', {
          u: setUpstream,
          f: true
        }, [remote, branch], error => {
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
        projectTmpPath: 'tmp',
        repoTmpPath: 'gh-pages',
        commitMessage: 'Deploy dist files by ember-cli-deploy-ghpages',
        gitBranch: 'gh-pages',
        gitRemoteName: 'ember-cli-deploy'
      },

      requiredConfig: ['gitRemoteUrl'],

      setup: function (context) {
        let repo;
        let self = this;
        let branch = this.readConfig('gitBranch');
        let tmp = this.readConfig('projectTmpPath');
        let relativeRepoTmpPath = this.readConfig('repoTmpPath');
        let projectTmpPath = path.resolve(context.project.root, tmp);
        let repoTmpPath = path.resolve(projectTmpPath, relativeRepoTmpPath);

        return ensureDir(path.resolve(context.project.root, repoTmpPath))
          .then(function () {
            self.log('cloning project repository to tmp');

            // TODO: Replace with streams for faster copy.
            return copy(context.project.root, repoTmpPath, {
              // If you recursively copy the tmp directory, you'll have a bad
              // time.
              filter: path => (
                path !== projectTmpPath &&
                path.indexOf('node_modules') < 0 &&
                path.indexOf('bower_components') < 0
              )
            });
          })
          .then(function () {
            self.log('cloned project repository to tmp', { color: 'green' });

            repo = context.gitRepo = git(repoTmpPath);

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
        let self = this;
        let tmp = this.readConfig('projectTmpPath');
        let repoTmpPath = path.join(tmp, this.readConfig('repoTmpPath'));
        repoTmpPath = path.resolve(context.project.root, repoTmpPath);

        this.log('copying dist files to tmp');

        return copyDistFiles(context.distDir, context.distFiles, repoTmpPath)
          .then(function () {
            self.log('copied dist files to tmp', { color: 'green' });
            self.log('staging all files for commit');
            return stageAllFiles(context.gitRepo);
          })
          .then(function () {
            self.log('committing staged files');
            return commit(context.gitRepo, self.readConfig('commitMessage'));
          })
          .then(function () {
            self.log('committed all staged files', { color: 'green' });
          })
          .catch(error => self.log(error));
      },

      willUpload: function (context) {
        let remoteName = this.readConfig('gitRemoteName');
        let remoteUrl = this.readConfig('gitRemoteUrl');
        let branch = this.readConfig('gitBranch');

        return addRemote(context.gitRepo, remoteName, remoteUrl)
          .then(() => {
            this.log('remote repository added', { color: 'green' });
            return setUpstream(context.gitRepo, branch, remoteName);
          })
          .catch(() => {
            // Upstream branch does not exist. Mark it so we know during
            // upload stage.
            this.log('remote branch does not exist', { color: 'yellow' });
            context.setUpstreamOnPush = true;
          });
      },

      upload: function (context) {
        let repo = context.gitRepo;
        let branch = this.readConfig('gitBranch');
        let remoteName = this.readConfig('gitRemoteName');
        let setUpstream = context.setUpstreamOnPush;

        this.log('pushing to remote repository');

        return pushUpstream(repo, branch, remoteName, setUpstream)
          .then(() => {
            this.log('push success', { color: 'green' });
          })
          .catch(error => this.log(error, { color: 'red' }));
      },

      teardown: function (context) {
      }
    });

    return new GHPagesPlugin();
  }
};
