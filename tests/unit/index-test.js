'use strict';

var expect = require('chai').expect;

describe('github pages plugin', function () {
  let subject;
  let stubProject;
  let plugin;
  let context;
  let mockUI;

  before(function () {
    subject = require('../../index');
    stubProject = {
      name: function () {
        return 'stubbed-project';
      },
      root: process.cwd()
    };
  });

  beforeEach(function () {
    plugin = subject.createDeployPlugin({
      name: 'ghpages'
    });

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
      project: stubProject,
      config: {}
    };
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

  it('implements upload hook', function () {
    expect(plugin.upload).to.be.a('function');
  });

  describe('#setup hook', function () {
    beforeEach(function () {
      plugin.beforeHook(context);
      plugin.configure(context);
    });

    it('creates gh-pages branch that does not already exist', function () {
      plugin.setup(context);
    });
  });
});
