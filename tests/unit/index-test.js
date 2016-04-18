'use strict';

var expect = require('chai').expect;

describe('github pages plugin', function () {
  let subject;
  let plugin;

  before(function () {
    subject = require('../../index');
  });

  beforeEach(function () {
    plugin = subject.createDeployPlugin({
      name: 'ghpages'
    });
  });

  it('has a name', function () {
    expect(plugin.name).to.equal('ghpages');
  });

  it('implements configure hook', function () {
    expect(plugin.configure).to.be.a('function');
  });

  it('implements didBuild hook', function () {
    expect(plugin.didBuild).to.be.a('function');
  });

  it('implements upload hook', function () {
    expect(plugin.upload).to.be.a('function');
  });
});
