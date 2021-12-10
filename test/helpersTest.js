const { assert, expect } = require('chai');

const { findUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('findUserByEmail', function() {
  it('should return a userID with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";

    assert.equal(expectedUserID, testUsers[user].id);
  });
  
  it('should return a undefined with an unvalid email', function() {
    const user = findUserByEmail("user3@example.com", testUsers);

    assert.isUndefined(user);
  });

});