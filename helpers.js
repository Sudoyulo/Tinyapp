const findUserByEmail = (email, userdb) => { //returns userid from email
  for (const user in userdb) {
    if (userdb[user].email === email) {
      return userdb[user].id;
    }
  }
  return false;
};

const reduceUrlDatabase = (myUserID, urlDB) => { // removes urls not made by user

  let userDatabse = {};

  for (const accounts in urlDB) {

    if (urlDB[accounts].userID === myUserID) {
      userDatabse[accounts] = urlDB[accounts];
    }
  }

  return userDatabse;

};

const getLoggedInUser = (req, users) => { //returns id of user logged in

  const user_id = req.session.user_id;
  
  if (users[user_id]) {
    return users[user_id];
  }
  return null;
};

module.exports = { findUserByEmail, reduceUrlDatabase, getLoggedInUser };