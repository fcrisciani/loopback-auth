'use strict';

require('source-map-support').install();
import loopback = require('loopback');
let boot = require('loopback-boot');
let LoopBackContext = require('loopback-context');
let path = require('path');

let app = module.exports = loopback();
app.use(LoopBackContext.perRequest());
app.use(loopback.token());

app.use(async (req: loopback.Request, res: loopback.Response,
               next: loopback.NextFunction) => {
  if (!req.accessToken) {
    return next();
  }
  let user = await app.models.User.findById(req.accessToken.userId);
  if (!user) {
    return next(new Error('No user with this access token was found.'));
  }
  let loopbackContext = LoopBackContext.getCurrentContext();
  if (loopbackContext) {
    loopbackContext.set('currentUser', user);
  }
  return next();
});

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    let baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s ', baseUrl);
    if (app.get('loopback-component-explorer')) {
      let explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

if (require.main === module) {
// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
  let serverOptions = {'appRootDir': ''};
  // server should use the test models and the server runtime env is 'test'
  serverOptions.appRootDir = path.resolve(__dirname, './');
  boot(app, serverOptions, function(err: string) {
    if (err) throw err;
    // start the server if `$ node phoenix.js`
    app.start();
  });
}
