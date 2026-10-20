const fs = require('fs');

const originalRm = fs.rm;
if (originalRm) {
  fs.rm = function(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    originalRm(path, options, (err) => {
      if (err && (err.code === 'EPERM' || err.code === 'ENOTEMPTY')) {
        console.log('Ignored EPERM on', path);
        return callback ? callback(null) : undefined;
      }
      if (callback) callback(err);
    });
  };
}

const originalRmSync = fs.rmSync;
if (originalRmSync) {
  fs.rmSync = function(path, options) {
    try {
      originalRmSync(path, options);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'ENOTEMPTY') {
        console.log('Ignored EPERM on', path);
      } else {
        throw err;
      }
    }
  };
}

const originalRmdir = fs.rmdir;
if (originalRmdir) {
  fs.rmdir = function(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    originalRmdir(path, options, (err) => {
      if (err && (err.code === 'EPERM' || err.code === 'ENOTEMPTY')) {
        console.log('Ignored EPERM on', path);
        return callback ? callback(null) : undefined;
      }
      if (callback) callback(err);
    });
  };
}

const originalRmdirSync = fs.rmdirSync;
if (originalRmdirSync) {
  fs.rmdirSync = function(path, options) {
    try {
      originalRmdirSync(path, options);
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'ENOTEMPTY') {
        console.log('Ignored EPERM on', path);
      } else {
        throw err;
      }
    }
  };
}
