'use strict';

const Joi = require('joi');
const Boom = require('boom');
const Bcrypt = require('bcryptjs');
const Chalk = require('chalk');
const Jwt = require('jsonwebtoken');
const RestHapi = require('rest-hapi');

const Config = require('../../config');
const Token = require('../token');

const USER_ROLES = Config.get('/constants/USER_ROLES');
const AUTH_STRATEGIES = Config.get('/constants/AUTH_STRATEGIES');
const expirationPeriod = Config.get('/expirationPeriod');
const authStrategy = Config.get('/restHapiConfig/authStrategy');

module.exports = function (server, mongoose, logger) {

  // Login Endpoint
  (function() {
    const Log = logger.bind(Chalk.magenta("Login"));
    const AuthAttempt = mongoose.model('authAttempt');
    const Permission = mongoose.model('permission');
    const Session = mongoose.model('session');
    const User = mongoose.model('user');

    Log.note("Generating Login endpoint");

    const loginPre = [
      {
        assign: 'abuseDetected',
        method: function (request, reply) {

          const ip = request.info.remoteAddress;
          const email = request.payload.email;

          AuthAttempt.abuseDetected(ip, email, Log)
            .then(function (detected) {
              if (detected) {
                return reply(Boom.badRequest('Maximum number of auth attempts reached. Please try again later.'));
              }
              return reply();
            })
            .catch(function (error) {
              Log.error(error);
              return reply(Boom.gatewayTimeout('An error occurred.'));
            });
        }
      },
      {
        assign: 'user',
        method: function (request, reply) {

          const email = request.payload.email;
          const password = request.payload.password;

          User.findByCredentials(email, password, Log)
            .then(function (user) {
              return reply(user);
            })
            .catch(function (error) {
              Log.error(error);
              return reply(Boom.gatewayTimeout('An error occurred.'));
            });
        }
      },
      {
        assign: 'logAttempt',
        method: function (request, reply) {

          if (request.pre.user) {
            return reply();
          }

          const ip = request.info.remoteAddress;
          const email = request.payload.email;

          AuthAttempt.createInstance(ip, email, Log)
            .then(function (authAttempt) {
              return reply(Boom.badRequest('Invalid Email or Password.'));
            })
            .catch(function (error) {
              Log.error(error);
              return reply(Boom.gatewayTimeout('An error occurred.'));
            });
        }
      },
      {
        assign: 'isActive',
        method: function (request, reply) {

          if (request.pre.user.isActive) {
            return reply();
          }
          else {
            return reply(Boom.badRequest('Account is inactive.'));
          }
        }
      },
      {
        assign: 'isEnabled',
        method: function (request, reply) {

          if (request.pre.user.isEnabled) {
            return reply();
          }
          else {
            return reply(Boom.badRequest('Account is disabled.'));
          }
        }
      },
      {
        assign: 'isDeleted',
        method: function (request, reply) {
          const user = request.pre.user;

          if (user.isDeleted) {
            return reply(Boom.badRequest('Account is deleted.'));
          }

          return reply();
        }
      },
      {
        assign: 'session',
        method: function (request, reply) {
          if (authStrategy === AUTH_STRATEGIES.TOKEN) {
            reply(null);
          }
          else {
            Session.createInstance(request.pre.user)
              .then(function (session) {
                return reply(session);
              })
              .catch(function (error) {
                Log.error(error);
                return reply(Boom.gatewayTimeout('An error occurred.'));
              });
          }
        }
      },
      {
        assign: 'scope',
        method: function (request, reply) {
          return Permission.getScope(request.pre.user, Log)
            .then(function (scope) {
              return reply(scope);
            });
        }
      },
      {
        assign: 'standardToken',
        method: function (request, reply) {
          switch (authStrategy) {
            case AUTH_STRATEGIES.TOKEN:
              reply(Token(request.pre.user, null, request.pre.scope, expirationPeriod.long, Log));
              break;
            case AUTH_STRATEGIES.SESSION:
              reply(null);
              break;
            case AUTH_STRATEGIES.REFRESH:
              reply(Token(request.pre.user, null, request.pre.scope, expirationPeriod.short, Log));
              break;
            default:
              break;
          }
        }
      },
      {
        assign: 'sessionToken',
        method: function (request, reply) {
          switch (authStrategy) {
            case AUTH_STRATEGIES.TOKEN:
              reply(null);
              break;
            case AUTH_STRATEGIES.SESSION:
              reply(Token(null, request.pre.session, request.pre.scope, expirationPeriod.long, Log));
              break;
            case AUTH_STRATEGIES.REFRESH:
              reply(null);
              break;
            default:
              break;
          }
        }
      },
      {
        assign: 'refreshToken',
        method: function (request, reply) {
          switch (authStrategy) {
            case AUTH_STRATEGIES.TOKEN:
              reply(null);
              break;
            case AUTH_STRATEGIES.SESSION:
              reply(null);
              break;
            case AUTH_STRATEGIES.REFRESH:
              reply(Token(null, request.pre.session, request.pre.scope, expirationPeriod.long, Log));
              break;
            default:
              break;
          }
        }
      }
    ];

    const loginHandler = function (request, reply) {

      let accessToken = "";
      let response = {};

      request.pre.user.password = "";
      request.pre.user.pin = "";

      switch (authStrategy) {
        case AUTH_STRATEGIES.TOKEN:
          accessToken = request.pre.standardToken;
          response = {
            user: request.pre.user,
            accessToken,
            scope: request.pre.scope
          };
          break;
        case AUTH_STRATEGIES.SESSION:
          accessToken = request.pre.sessionToken;
          response = {
            user: request.pre.user,
            accessToken,
            scope: request.pre.scope
          };
          break;
        case AUTH_STRATEGIES.REFRESH:
          accessToken = request.pre.standardToken;
          response = {
            user: request.pre.user,
            refreshToken: request.pre.refreshToken,
            accessToken,
            scope: request.pre.scope
          };
          break;
        default:
          break;
      }

      return reply(response);
    };

    server.route({
      method: 'POST',
      path: '/login',
      config: {
        handler: loginHandler,
        auth: null,
        description: 'User login.',
        tags: ['api', 'Login'],
        validate: {
          payload: {
            email: Joi.string().email().lowercase().required(),
            password: Joi.string().required()
          }
        },
        pre: loginPre,
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              { code: 200, message: 'Success' },
              { code: 400, message: 'Bad Request' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
            ]
          }
        }
      },
    });
  }());


  // Forgot Password Endpoint
  (function() {
    const Log = logger.bind(Chalk.magenta("Forgot Password"));
    const User = mongoose.model('user');
    const Session = mongoose.model('session');

    Log.note("Generating Forgot Password endpoint");

    const forgotPasswordPre = [{
      assign: 'user',
      method: function (request, reply) {

        const conditions = {
          email: request.payload.email
        };

        User.findOne(conditions)
          .then(function (user) {
            // NOTE: For more secure applications, the server should respond with a success even if the user isn't found
            // since this reveals the existence of an account. For more information, refer to the links below:
            // https://postmarkapp.com/guides/password-reset-email-best-practices
            // https://security.stackexchange.com/questions/40694/disclose-to-user-if-account-exists
            if (!user) {
              return reply(Boom.notFound('User not found.'));
            }
            return reply(user);
          })
          .catch(function (error) {
            Log.error(error);
            return reply(Boom.badImplementation('There was an error accessing the database.'));
          });
      }
    }];

    const forgotPasswordHandler = function (request, reply) {

      const mailer = request.server.plugins.mailer;

      let keyHash = {};
      let user = {};
      const pinRequired = request.auth.credentials ? !request.auth.credentials.scope.includes(USER_ROLES.SUPER_ADMIN) : true;

      Session.generateKeyHash(Log)
        .then(function (result) {
          keyHash = result;

          const _id = request.pre.user._id.toString();
          const update = {
            resetPassword: {
              hash: keyHash.hash,
              pinRequired
            },
          };

          return RestHapi.update(User, _id, update);
        })
        .then(function (result) {
          user = result;

          const firstName = user.firstName ? user.firstName : null;
          const lastName = user.lastName ? user.lastName : null;

          const emailOptions = {
            subject: 'Reset your ' + Config.get('/websiteName') + ' password',
            to: {
              name: firstName + " " + lastName,
              address: request.payload.email
            }
          };

          const template = 'forgot-password';

          const token = Jwt.sign({
            email: request.payload.email,
            key: keyHash.key
          }, Config.get('/jwtSecret'), { algorithm: 'HS256', expiresIn: expirationPeriod.medium });

          const context = {
            clientURL: Config.get('/clientURL'),
            websiteName: Config.get('/websiteName'),
            key: token,
            pinRequired
          };

          return mailer.sendEmail(emailOptions, template, context, Log);
        })
        .then(function (result) {
          return reply({ message: 'Success.' });
        })
        .catch(function (error) {
          if (error.isBoom) {
            return reply(error);
          }
          Log.error(error);
          return reply(Boom.gatewayTimeout('An error occurred.'));
        })
    };

    server.route({
      method: 'POST',
      path: '/login/forgot',
      config: {
        handler: forgotPasswordHandler,
        auth: {
          strategy: authStrategy,
          mode: 'try'
        },
        description: 'Forgot password.',
        tags: ['api', 'Login', 'Forgot Password'],
        validate: {
          payload: {
            email: Joi.string().email().required()
          }
        },
        pre: forgotPasswordPre,
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              { code: 200, message: 'Success' },
              { code: 400, message: 'Bad Request' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
            ]
          }
        }
      }
    });
  }());


  // Reset Password Endpoint
  (function() {
    const Log = logger.bind(Chalk.magenta("Reset Password"));
    const User = mongoose.model('user');

    Log.note("Generating Reset Password endpoint");

    const resetPasswordPre = [
      {
        assign: 'decoded',
        method: function (request, reply) {

          Jwt.verify(request.payload.token, Config.get('/jwtSecret'), function (err, decoded) {
            if (err) {
              Log.error(err)
              return reply(Boom.badRequest('Invalid token.'));
            }

            return reply(decoded);
          });
        }
      },
      {
        assign: 'user',
        method: function (request, reply) {

          const conditions = {
            email: request.pre.decoded.email,
            isDeleted: false
          };

          User.findOne(conditions)
            .then(function (user) {
              if (!user || !user.resetPassword) {
                return reply(Boom.badRequest('Invalid email or key.'));
              }
              return reply(user);
            })
            .catch(function (error) {
              Log.error(error);
              return reply(Boom.badImplementation('There was an error accessing the database.'));
            });
        }
      },
      {
        assign: 'checkPIN',
        method: function (request, reply) {

          // EXPL: A PIN is not required if the SuperAdmin initiated the password reset
          if (request.pre.user.resetPassword.pinRequired) {
            if (!request.payload.pin) {
              return reply(Boom.badRequest('PIN required.'));
            }
            const key = request.payload.pin;
            const hash = request.pre.user.pin;
            Bcrypt.compare(key, hash)
              .then(function (keyMatch) {
                if (!keyMatch) {
                  return reply(Boom.badRequest('Invalid PIN.'));
                }
                return reply(keyMatch);
              })
              .catch(function (error) {
                Log.error(error);
                return reply(Boom.badImplementation('There was an error checking the PIN.'));
              });
          }
          else {
            return reply(true);
          }
        }
      }];

    const resetPasswordHandler = function (request, reply) {

      const key = request.pre.decoded.key;
      const resetPassword = request.pre.user.resetPassword;
      Bcrypt.compare(key, resetPassword.hash)
        .then(function (keyMatch) {
          if (!keyMatch) {
            throw Boom.badRequest('Invalid email or key.');
          }

          return User.generateHash(request.payload.password, Log);
        })
        .then(function (passwordHash) {

          const _id = request.pre.user._id.toString();
          const update = {
            $set: {
              password: passwordHash.hash
            },
            $unset: {
              resetPassword: undefined
            }
          };

          return RestHapi.update(User, _id, update);
        })
        .then(function (result) {
          return reply({ message: 'Success.' });
        })
        .catch(function (error) {
          if (error.isBoom) {
            return reply(error);
          }
          Log.error(error);
          return reply(Boom.gatewayTimeout('An error occurred.'));
        })
    };

    server.route({
      method: 'POST',
      path: '/login/reset',
      config: {
        handler: resetPasswordHandler,
        auth: null,
        description: 'Reset password.',
        tags: ['api', 'Login', 'Reset Password'],
        validate: {
          payload: {
            token: Joi.string().required(),
            password: Joi.string().required(),
            pin: Joi.string().allow(null).required()
          }
        },
        pre: resetPasswordPre,
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              { code: 200, message: 'Success' },
              { code: 400, message: 'Bad Request' },
              { code: 404, message: 'Not Found' },
              { code: 500, message: 'Internal Server Error' }
            ]
          }
        }
      }
    });
  }());

};
