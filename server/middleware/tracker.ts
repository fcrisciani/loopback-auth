import debug = require('debug');
import Express = require('express');
const log = debug('loopbackauth:TimeTracker');

module.exports = function() {
  return function tracker(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
    log(`Tracking middleware triggered on ${req.url}`);
    let start = process.hrtime();
    res.once('finish', function() {
      let diff = process.hrtime(start);
      let ms = diff[0] * 1e3 + diff[1] * 1e-6;
      log(`Tracking middleware ${req.url} finished in ${ms} ms`);
    });
    next();
  };
};
