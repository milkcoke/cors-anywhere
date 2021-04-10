// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
// var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
var originWhitelist = ["http://sarang.org","https://sarang.org","http://www.sarang.org","https://www.sarang.org"];
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
// var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);
// 1분에 10000회.  sarang.org 및 서브도메인들은 무제한
var checkRateLimit = require('./lib/rate-limit')("10000 1 /(.*\.)?sarang\.org/");

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  // requireHeader: ['origin', 'x-requested-with'],
  // requireHeader: ['x-requested-with'],
  requireHeader: [],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  redirectSameOrigin: true,
  // If set, an Access-Control-Max-Age request header with this value (in seconds) will be added.
  corsMaxAge: 60*60*24*30,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
  // If set, a https.Server will be created
  // httpsOptions: true,
}).listen(port, host, function() {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
