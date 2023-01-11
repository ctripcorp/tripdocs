const path = require('path');

const fs = require('fs');

const WORKER_DIR = path.resolve(__dirname, '../../worker');

const BLOB_CODE_SNIPPET_REGEX = /(?<=const code = `)[\S\s]*(?=`;)/gm;

const COMMENT_REGEX = /\/(\*[\s\S]*?\*\/|\/.*)/gm;

class ToInlineBlobWorkerPlugin {
  constructor(opts) {
    opts = Object.assign({});
  }
  apply(compiler) {
    const pluginName = ToInlineBlobWorkerPlugin.name;
    compiler.hooks.environment.tap(pluginName, (compilation, callback) => {
      const jsWorkerPath = path.resolve(WORKER_DIR, 'validation.worker.js');
      const jsWorkerStr = fs.readFileSync(jsWorkerPath).toString('utf8');
      const blobWorkerPath = path.resolve(WORKER_DIR, 'validationRun.worker.ts');
      const blobWorkerStr = fs.readFileSync(blobWorkerPath).toString('utf8');
      if (BLOB_CODE_SNIPPET_REGEX.test(blobWorkerStr)) {
        const newJsWorkerStr = jsWorkerStr.replace(COMMENT_REGEX, '');
        const newBlobWorkerStr = blobWorkerStr.replace(BLOB_CODE_SNIPPET_REGEX, newJsWorkerStr);
        fs.writeFileSync(blobWorkerPath, newBlobWorkerStr);
      }
    });
  }
}

module.exports = ToInlineBlobWorkerPlugin;
