'use strict';

module.exports = function(app, callback) {
  var path = require('path');
  var models = require(path.resolve(__dirname, '../model-config.json'));
  var datasources = require(path.resolve(__dirname, '../datasources.json'));

  function autoUpdateAll() {
    Object.keys(models).forEach(function(key) {
      if (typeof models[key].dataSource != 'undefined') {
        if (typeof datasources[models[key].dataSource] != 'undefined') {
          /*
           This moules updates a data model that is stored in the database
           without deleteing the actual data.
           If a new table is required or a colum is required it's created

           */
          app.dataSources[models[key].dataSource].autoupdate(key, function(err) {
            if (err) throw err;
            // console.log('Model ' + key + ' updated');
          });
        }
      }
    });
  }

  autoUpdateAll();
  callback();
};
