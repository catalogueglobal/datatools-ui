import auth0 from '../Auth0Manager'

describe('common > user > Auth0Manager >', () => {
  it('should login with lock', (done) => {
    // setup localStorage
    const storage = {}
    window.localStorage = {
      getItem: (k) => storage[k],
      setItem: (k, v) => { storage[k] = v }
    }

    // setup mock action
    const receiveTokenAndProfile = jest.fn()

    // set auth0 lock options to generate test response
    auth0.lockOptions = {
      fakeAuthenticatedToken: 'fake-token',
      getProfileSuccess: true,
      getProfileResult: {
        app_metadata: {
          datatools: []
        }
      }
    }

    auth0.loginWithLock({
      receiveTokenAndProfile
    })

    // do a timeout because the promise needs to execute
    setTimeout(() => {
      expect(receiveTokenAndProfile.mock.calls).toMatchSnapshot()
      done()
    }, 10)
  })
})
