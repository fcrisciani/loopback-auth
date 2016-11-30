'use strict';

import VersionModel = require('./version.d');

const npath = require('path');
const selfPkg = require(npath.resolve(__dirname, '../../package.json'));

import loopback = require('loopback');

module.exports = function (version: VersionModel.PersistedModelVersion) {
  version.disableRemoteMethodByName('patchOrCreate', true);
  version.disableRemoteMethodByName('prototype.patchAttributes', true);
  // post
  version.disableRemoteMethodByName('create', true);
  // put
  version.disableRemoteMethodByName('replaceOrCreate', true);
  version.disableRemoteMethodByName('replaceById', true);
  // delete
  version.disableRemoteMethodByName('delete', true);
  version.disableRemoteMethodByName('deleteById', true);
  // get
  version.disableRemoteMethodByName('find', true);
  version.disableRemoteMethodByName('findById', true);
  version.disableRemoteMethodByName('findOne', true);
  version.disableRemoteMethodByName('exists', true);
  version.disableRemoteMethodByName('count', true);
  version.disableRemoteMethodByName('updateAll', true);
  version.disableRemoteMethodByName('createChangeStream', true);
  version.disableRemoteMethodByName('upsertWithWhere', true);

  // record boot time.
  version.creationTime = new Date();

  // add a remote method for ifc stats
  version.remoteMethod('versionInfo', {
    isStatic: true,
    returns: { 'arg': 'version', type: 'Version', root: true },
    http: {
      path: '/',
      verb: 'get',
    },
    description: 'Queries current version of Phoenix',
  });

  // function to respond to remote method
  version.versionInfo = async function () {
    let dt = await version.replaceOrCreate({
      'name': selfPkg.name,
      'version': selfPkg.version,
      'instanceStartTime': version.creationTime,
    });
    return dt;
  };
};
