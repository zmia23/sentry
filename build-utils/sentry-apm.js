/*eslint-env node*/
/*eslint import/no-nodejs-modules:0 */
const Sentry = require('@sentry/node');
require('@sentry/apm');

class SentryWebpackPerfPlugin {
  constructor({dsn}) {
    Sentry.init({
      dsn,
      tracesSampleRate: 1,
      // integrations: [
      // new Integrations.Tracing({
      // // tracingOrigins: ['localhost', 'sentry.io', /^\//],
      // // tracesSampleRate,
      // }),
      // ],
    });
    // this.transaction.initFinishedSpans();
  }

  apply(compiler) {
    let spans = {};
    this.transaction = Sentry.getCurrentHub().startSpan({
      op: 'webpack-init',
      description: 'webpack initialization',
      transaction: 'webpack',
    });

    compiler.hooks.done.tapAsync(
      'SentryWebpackPerfPlugin',
      async (_compilation, callback) => {
        this.transaction.finish();
        await Sentry.flush();
        callback();
      }
    );

    compiler.hooks.beforeCompile.tapAsync(
      'SentryWebpackPerfPlugin',
      (params, callback) => {
        spans.compile = Sentry.getCurrentHub().startSpan({
          op: 'compile',
        });
        callback();
      }
    );
    compiler.hooks.afterCompile.tapAsync(
      'SentryWebpackPerfPlugin',
      (params, callback) => {
        spans.compile.finish();
        callback();
      }
    );
    // compiler.hooks.normalModuleFactory.tap('SentryWebpackPerfPlugin', compilation => {});

    compiler.hooks.compilation.tap('SentryWebpackPerfPlugin', compilation => {
      compilation.hooks.buildModule.tap('SentryWebpackPerfPlugin', module => {
        // console.log(module);
      });
    });
  }
}
module.exports = SentryWebpackPerfPlugin;
