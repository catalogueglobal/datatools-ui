import jwt from 'jsonwebtoken'

module.exports = {
  WebAuth: class WebAuth {
    constructor ({domain, clientID}) {
      if (!domain) {
        throw new Error('Domain required')
      }
      if (!clientID) {
        throw new Error('Client ID required')
      }
    }

    renewAuth (
      {
        audience,
        nonce,
        postMessageDataType,
        redirectUri,
        scope,
        usePostMessage
      },
      callback
    ) {
      return callback(null, {
        accessToken: jwt.sign(
          {
            nonce
          },
          'signingKey'
        ),
        idToken: jwt.sign(
          {
            nonce
          },
          'signingKey'
        )
      })
    }
  }
}
