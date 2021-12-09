const { response } = require("express");
const express = require("express");
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ["user_id"],

}))

app.set("view engine", "ejs");

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
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

const getLoggedInUser = (req) => {

  // console.log("req.cookies",req.cookies);

  const user_id = req.session.user_id;
  
  if (users[user_id]) {
    return users[user_id];
  }
  return null;
};

const findUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  }
return false;
};

const reduceUrlDatabase = (myUserID) => {

  let userDatabse = {};

  for (const accounts in urlDatabase) {

    if (urlDatabase[accounts].userID === myUserID) {
      userDatabse[accounts] = urlDatabase[accounts];
    }
  }

  return userDatabse;

};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/login", (req, res) => {  //log int part 3
  
  const templateVars = {
    urls: urlDatabase,
    users: users,
    user: getLoggedInUser(req)
  };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => { ///header
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  if (email === "" || password === "") {
    res.status(400).send("no inputs");
  }
  
  const userID = findUserByEmail(email);
  
  if (!userID) {
    res.status(403).send("No such user");
  }
  // bcrypt.compareSync(users[userID].password hashedPassword);
  if (bcrypt.compareSync(users[userID].password, hashedPassword)) {
    
    res.status(403).send("Bad password");
  }

  if (userID && bcrypt.compareSync(users[userID].password, hashedPassword)) {
    
    req.session.user_id = findUserByEmail(email);

  }

  res.redirect("/urls");
});

app.post("/logout", (req, res) => { ///header

  req.session = null;

  res.redirect("/urls");
});

app.get("/urls", (req, res) => {   ////?? only giving current user id

  const templateVars = {
    reduced: reduceUrlDatabase(req.session.user_id),
    urls: urlDatabase,
    users: users,
    myAccount: req.session.user_id,
    user: getLoggedInUser(req)
  };
  // console.log(urlDatabase);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {  // the / at the end means something... forgot what

  if (!req.session.user_id) {
    
    res.redirect("/login");
  } else {
    const templateVars = {
      urls: urlDatabase,
      users: users,
      user: getLoggedInUser(req)
    };
    res.render("urls_new", templateVars);
  }
});

app.post("/urls", (req, res) => {

  // console.log("this is the pair",req.body);  // Log the POST request body to the console
  let randomname = generateRandomString();
  urlDatabase[randomname] = {
    longURL:  req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${randomname}`);         // Respond with 'Ok' (we will replace this)

});

app.get("/urls/:shortURL", (req, res) => {
  
  const shortURL = req.params.shortURL; //keys
  const longURL = urlDatabase[shortURL].longURL; //values
  const templateVars = {
    shortURL,
    longURL,
    users: users,
    user: getLoggedInUser(req)
  };

  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    res.status(400).send("Not authorized");
  }
  
  // console.log("sadsa",{urlDatabase});
  res.render("urls_show", templateVars);

});

app.post("/urls/:shortURL", (req, res) => { ///after edit

  urlDatabase[req.params.shortURL]["longURL"] = req.body.newURL;
  res.redirect(`/urls/`);
});

app.post("/urls/:shortURL/delete", (req, res) => {  //delete?  not autho

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
 
});

app.get("/u/:shortURL", (req, res) => {

  const longURL = urlDatabase[req.params.shortURL][longURL];
  res.redirect(longURL);

});

app.get("/register", (req, res) => { //password get

  const templateVars = {
    urls: urlDatabase,
    users: users,
    user: getLoggedInUser(req)
  };

  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => { //password post

  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    res.status(400).send("no inputs");
  } else if (findUserByEmail(email)) {
    res.status(400).send("already exists");
  } else if (!getLoggedInUser(req)) {
    users[id] = {
      id, email, hashedPassword
    };
    // console.log(users);
    // console.log(existingUser);
    //req.session.user_id = id;
    req.session.user_id = id;   ///log in? req.cookies?
    res.redirect("/urls");
  }

});

app.get("/root/:airplane/:train/:boat", (req, res) => {
  // console.log(req.params); //req params is the url. one param is one :/
  //saves as an object {airplane: /url link, train:/url/url, boat...}
  res.send("hello"); //body is in the last location (3 files in)
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/*", (req, res) => {
  
  res.status(404).send("Page does not exist");

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});