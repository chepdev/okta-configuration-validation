'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*!
 * Copyright (c) 2018-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

var merge = require('lodash/merge');

var ConfigurationValidationError = function (_Error) {
  _inherits(ConfigurationValidationError, _Error);

  function ConfigurationValidationError() {
    _classCallCheck(this, ConfigurationValidationError);

    return _possibleConstructorReturn(this, (ConfigurationValidationError.__proto__ || Object.getPrototypeOf(ConfigurationValidationError)).apply(this, arguments));
  }

  return ConfigurationValidationError;
}(Error);

var configUtil = module.exports;

var findDomainURL = 'https://bit.ly/finding-okta-domain';
var findAppCredentialsURL = 'https://bit.ly/finding-okta-app-credentials';

var copyCredentialsMessage = 'You can copy it from the Okta Developer Console ' + 'in the details for the Application you created. ' + ('Follow these instructions to find it: ' + findAppCredentialsURL);

var isHttps = new RegExp('^https://');
var hasProtocol = new RegExp('://');
var hasDomainAdmin = /-admin.(okta|oktapreview|okta-emea).com/;
var hasDomainTypo = new RegExp('(.com.com)|(://.*){2,}');
var endsInPath = new RegExp('/$');

configUtil.buildConfigObject = function (config) {
  // See all supported options: https://github.com/okta/okta-auth-js#configuration-reference
  // Support for parameters with an underscore will be deprecated in a future release
  // camelCase was added 2/11/2019: https://github.com/okta/okta-oidc-js/commit/9b04ada6a01c9d9aca391abf0de3e5ecc9811e64

  config = config || {}; // accept empty

  // Legacy support: allow a property named 'scope' to be either an array or a string.
  var scopes = config.scopes;
  if (!scopes && config.scope) {
    if (Array.isArray(config.scope)) {
      scopes = config.scope;
    } else {
      scopes = config.scope.split(/\s+/);
    }
  }

  // Legacy support: allow TokenManager config 'autoRenew' and 'storage' to be defined at top-level
  var tokenManager = config.tokenManager;
  var autoRenew = config.autoRenew !== undefined ? config.autoRenew : config.auto_renew; // Only check legacy property if necessary
  var storage = config.storage;
  if (storage !== undefined || autoRenew !== undefined) {
    // Properties already defined within the "tokenManager" section will not be overwritten
    tokenManager = merge({
      autoRenew: autoRenew,
      storage: storage
    }, tokenManager || {});
  }

  // Legacy support: allow 'responseType' to be a string or an array
  var responseType = config.responseType || config.response_type;
  if (typeof responseType === 'string' && responseType.indexOf(' ') >= 0) {
    responseType = responseType.split(/\s+/);
  }

  var normalizedConfig = merge({}, config, {
    clientId: config.clientId || config.client_id,
    redirectUri: config.redirectUri || config.redirect_uri,
    responseType: responseType,
    scopes: scopes,
    tokenManager: tokenManager
  });

  return normalizedConfig;
};

configUtil.assertIssuer = function (issuer) {
  var testing = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var copyMessage = 'You can copy your domain from the Okta Developer ' + 'Console. Follow these instructions to find it: ' + findDomainURL;

  if (testing.disableHttpsCheck) {
    var httpsWarning = 'Warning: HTTPS check is disabled. ' + 'This allows for insecure configurations and is NOT recommended for production use.';
    /* eslint-disable-next-line no-console */
    console.warn(httpsWarning);
  }

  if (!issuer) {
    throw new ConfigurationValidationError('Your Okta URL is missing. ' + copyMessage);
  } else if (!testing.disableHttpsCheck && !issuer.match(isHttps)) {
    throw new ConfigurationValidationError('Your Okta URL must start with https. ' + ('Current value: ' + issuer + '. ' + copyMessage));
  } else if (issuer.match(/{yourOktaDomain}/)) {
    throw new ConfigurationValidationError('Replace {yourOktaDomain} with your Okta domain. ' + copyMessage);
  } else if (issuer.match(hasDomainAdmin)) {
    throw new ConfigurationValidationError('Your Okta domain should not contain -admin. ' + ('Current value: ' + issuer + '. ' + copyMessage));
  } else if (issuer.match(hasDomainTypo)) {
    throw new ConfigurationValidationError('It looks like there\'s a typo in your Okta domain. ' + ('Current value: ' + issuer + '. ' + copyMessage));
  }
};

configUtil.assertClientId = function (clientId) {
  if (!clientId) {
    throw new ConfigurationValidationError('Your client ID is missing. ' + copyCredentialsMessage);
  } else if (clientId.match(/{clientId}/)) {
    throw new ConfigurationValidationError('Replace {clientId} with the client ID of your Application. ' + copyCredentialsMessage);
  }
};

configUtil.assertClientSecret = function (clientSecret) {
  if (!clientSecret) {
    throw new ConfigurationValidationError('Your client secret is missing. ' + copyCredentialsMessage);
  } else if (clientSecret.match(/{clientSecret}/)) {
    throw new ConfigurationValidationError('Replace {clientSecret} with the client secret of your Application. ' + copyCredentialsMessage);
  }
};

configUtil.assertRedirectUri = function (redirectUri) {
  if (!redirectUri) {
    throw new ConfigurationValidationError('Your redirect URI is missing.');
  } else if (redirectUri.match(/{redirectUri}/)) {
    throw new ConfigurationValidationError('Replace {redirectUri} with the redirect URI of your Application.');
  }
};

configUtil.assertAppBaseUrl = function (appBaseUrl) {
  if (!appBaseUrl) {
    throw new ConfigurationValidationError('Your appBaseUrl is missing.');
  } else if (appBaseUrl.match(/{appBaseUrl}/)) {
    throw new ConfigurationValidationError('Replace {appBaseUrl} with the base URL of your Application.');
  } else if (!appBaseUrl.match(hasProtocol)) {
    throw new ConfigurationValidationError('Your appBaseUrl must contain a protocol (e.g. https://). Current value: ' + appBaseUrl + '.');
  } else if (appBaseUrl.match(endsInPath)) {
    throw new ConfigurationValidationError('Your appBaseUrl must not end in a \'/\'. Current value: ' + appBaseUrl + '.');
  }
};