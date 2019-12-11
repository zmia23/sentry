/*eslint-env node*/
/*eslint import/no-nodejs-modules:0 */
const Sentry = require('@sentry/node');
require('@sentry/apm');

class SentryWebpackPerfPlugin {
  constructor({dsn}) {
    Sentry.init({
      dsn,
      // integrations: [
      // new Integrations.Tracing({
      // // tracingOrigins: ['localhost', 'sentry.io', /^\//],
      // // tracesSampleRate,
      // }),
      // ],
    });
    Sentry.configureScope(scope => {
      scope.setTransaction('webpack');
      this.transaction = Sentry.getCurrentHub().startSpan({
        op: 'webpack-init',
        description: 'webpack initialization',
      });
      Sentry.getCurrentHub().captureEvent({
        spans: [],
        start_timestamp: +new Date(),
        tags: [],
        timestamp: +new Date() + 1000,
        transaction: 'transaction test',
        type: 'transaction',
      });
    });
  }

  apply(compiler) {
    compiler.hooks.done.tapAsync('SentryWebpackPerfPlugin', (_compilation, callback) => {
      this.transaction.finish();
      callback();
    });

    compiler.hooks.beforeCompile.tapAsync(
      'SentryWebpackPerfPlugin',
      (params, callback) => {
        callback();
      }
    );
    // compiler.hooks.normalModuleFactory.tap('SentryWebpackPerfPlugin', compilation => {});

    compiler.hooks.compilation.tap('SentryWebpackPerfPlugin', compilation => {
      compilation.hooks.buildModule.tap('SentryWebpackPerfPlugin', module => {
        console.log(module);
      });
    });
  }
}
module.exports = SentryWebpackPerfPlugin;
