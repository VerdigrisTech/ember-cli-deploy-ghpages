/* jshint mocha: true */
'use strict';

var expect = require('chai').expect;
var path = require('path');
var fs = require('fs-extra');
var git = require('gift');
var RSVP = require('rsvp');

describe('github pages plugin', function () {
  let subject;
  let stubProject;
  let plugin;
  let context;
  let mockUI;
  let repoPath;

  before(function () {
    subject = require('../../index');
    stubProject = {
      name: function () {
        return 'stubbed-project';
      },
      root: process.cwd()
    };

    mockUI = {
      verbose: true,
      messages: [],
      write: function () {},
      writeLine: function (message) {
        this.messages.push(message);
      }
    };

    context = {
      ui: mockUI,
      distDir: `${process.cwd()}/tests/fixtures/dist`,
      distFiles: [
        'index.html',
        'assets/fixture.css'
      ],
      project: stubProject,
      config: {
        ghpages: {
          gitRemoteUrl: 'git@github.com:VerdigrisTech/ember-cli-deploy-ghpages.git',
          gitRemoteName: 'ember-cli-deploy-test'
        }
      }
    };

    repoPath = path.resolve(context.project.root, 'tmp/gh-pages');
  });

  beforeEach(function () {
    plugin = subject.createDeployPlugin({
      name: 'ghpages'
    });
  });

  it('has a name', function () {
    expect(plugin.name).to.equal('ghpages');
  });

  it('implements setup hook', function () {
    expect(plugin.setup).to.be.a('function');
  });

  it('implements didBuild hook', function () {
    expect(plugin.didBuild).to.be.a('function');
  });

  it('implements willUpload hook', function () {
    expect(plugin.willUpload).to.be.a('function');
  });

  it('implements upload hook', function () {
    expect(plugin.upload).to.be.a('function');
  });

  it('implements teardown hook', function () {
    expect(plugin.teardown).to.be.a('function');
  });

  describe('#setup hook', function () {
    this.timeout(5000);

    let repo;

    before(function (done) {
      plugin.beforeHook(context);
      plugin.configure(context);
      plugin.setup(context)
        .then(function () {
          repo = git(repoPath);
          done();
        });
    });

    it('creates a tmp directory', function (done) {
      fs.access(repoPath, fs.F_OK, function (error) {
        expect(error).to.be.null;
        done();
      });
    });

    it("creates an orphaned branch named 'gh-pages'", function (done) {
      /**
       * Using symbolic reference is the most reliable way to get an orphaned
       * branch name.
       */
      repo.git('symbolic-ref', { short: true }, ['HEAD'], (error, stdout) => {
        expect(error).to.be.null;
        expect(stdout.trim()).to.equal('gh-pages');
        done();
      });
    });

    it('removes all files in the branch', function (done) {
      repo.status((error, status) => {
        let files = Object.keys(status.files)
          .filter(key => status.files[key].tracked);

        expect(files).to.be.empty;
        done();
      });
    });
  });

  describe('#didBuild hook', function () {
    this.timeout(5000);

    let repo;

    before(function (done) {
      plugin.beforeHook(context);
      plugin.configure(context);
      plugin.setup(context)
        .then(function () {
          return plugin.didBuild(context);
        })
        .then(function () {
          repo = git(repoPath);
          done();
        });
    });

    it('dist files are committed', function (done) {
      repo.ls_files((error, files) => {
        expect(files).to.be.eql([['assets/fixture.css'], ['index.html']]);
        done();
      });
    });
  });

  describe('#willUpload hook', function () {
    let repo;

    before(function (done) {
      plugin.beforeHook(context);
      plugin.configure(context);
      plugin.setup(context)
        .then(function () {
          return plugin.didBuild(context);
        })
        .then(function () {
          return plugin.willUpload(context);
        })
        .then(function () {
          repo = git(repoPath);
          done();
        });
    });

    it('adds remote repository for tracking', function (done) {
      repo.git('remote', {}, [], (error, stdout) => {
        expect(stdout).to.have.string('ember-cli-deploy-test');
        done();
      });
    });
  });

  describe('#upload hook', function () {
    this.timeout(10000);
    let repo;

    before(function (done) {
      plugin.beforeHook(context);
      plugin.configure(context);
      plugin.setup(context)
        .then(function () {
          return plugin.didBuild(context);
        })
        .then(function () {
          return plugin.willUpload(context);
        })
        .then(function () {
          return plugin.upload(context);
        })
        .then(function () {
          repo = git(repoPath);
          done();
        });
    });

    function revParse(branch) {
      return new RSVP.Promise((resolve, reject) => {
        repo.git('rev-parse', {}, [branch], (error, stdout) => {
          if (error) {
            return reject(error);
          }

          return resolve(stdout);
        });
      });
    }

    it('pushes branch to remote repository', function (done) {
      // Fetch from remote and see if local is up-to-date
      repo.remote_fetch('ember-cli-deploy-test', error => {
        expect(error).to.be.null;

        RSVP.all([
          revParse('gh-pages'),
          revParse('ember-cli-deploy-test/gh-pages')
        ]).then((shaHashes) => {
          expect(shaHashes[0]).to.be.equal(shaHashes[1]);
          done();
        });
      });
    });
  });

  describe('#teardown hook', function () {
    before(function (done) {
      plugin.beforeHook(context);
      plugin.teardown(context)
        .then(() => done());
    });

    it('performs cleanup', function () {
      function checkPath() {
        fs.accessSync(repoPath, fs.F_OK);
      }

      expect(checkPath).to.throw(Error);
    });
  });
});
