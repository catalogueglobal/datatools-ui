export default function Auth0Lock (clientID, domain, options) {
  this.options = options
}

Auth0Lock.prototype.getUserInfo = function (token, callback) {
  if (this.options.getProfileSuccess) {
    callback(null, this.options.getProfileResult)
  } else {
    callback(new Error('error obtaining Auth0 profile'))
  }
}

Auth0Lock.prototype.hide = function () {}

Auth0Lock.prototype.on = function (event, next) {
  next({ idToken: this.options.fakeAuthenticatedToken })
}

Auth0Lock.prototype.setOptions = function (options) {
  this.options = options
}

Auth0Lock.prototype.show = function () {}
