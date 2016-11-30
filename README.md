# Pheonix API Gateway

    An API gateway with multi-tenant auth.

# To setup

    Make sure you have node version 6.2 or higher
    To install node packages run
    > npm install

# To start the server
   > gulp start

# to run lint
   > gulp lint

# to run the test cases
   > gulp test

# to run lint on file save
   > gulp watch

# Note
> Install location (If gulp is not found)
  If the node packages are not installed in global space you will need to refer to them in current directory
  so running gulp will be ./node_modules/.bin/gulp
  Alternatively you can add it to your PATH env variable.
  To install gulp globally:
    > npm install -g gulp

# Testing

  Run all tests
  > gulp test

  Run a specific test
  > ./node_modules/.bin/mocha build/test/ -g <string|regex>
  string | regexp will be checked against the describe field of the test or the desciption lines
  E.g. from the file user-login.ts
  describe('REST API USER Login/Logout Tests',
  [...]
  it('should return fail login', async function() {
  [...]

  useful options:
    -b --bail: mocha will exit as there is a failure

  Possible commands:
  ./node_modules/.bin/mocha build/test/ -g Login  => will match all the tests because it matches the describe
  ./node_modules/.bin/mocha build/test/ -g "should return fail login" => will run only the test that probe
  the login failure
