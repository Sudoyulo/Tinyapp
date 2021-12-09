const { response } = require("express");
const express = require("express");
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();

const {findUserByEmail, reduceUrlDatabase, getLoggedInUser } = require("../helpers");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ["user_id"],
}));

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

app.get("/", (req, res) => {
  res.send("Hello!");
});

/* login forms */

app.get("/login", (req, res) => {
  
  const templateVars = {
    urls: urlDatabase,
    users: users,
    user: getLoggedInUser(req, users)
  };

  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => { ///header
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  if (email === "" || password === "") {
    return res.status(400).send("no inputs");
  }
  
  const userID = findUserByEmail(email, users);
  
  if (!userID) {
    return res.status(403).send("No such user");
  }

  if (!bcrypt.compareSync(req.body.password, users[userID].password)) {
    return res.status(403).send("Bad password");
  }
  
  if (userID && bcrypt.compareSync(password, users[userID].password)) {
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {

  if (getLoggedInUser(req, users) === null) {
    return res.redirect("/login");
  } else {
    const templateVars = {
      urls: urlDatabase,
      users: users,
      user: getLoggedInUser(req , users)
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    reduced: reduceUrlDatabase(req.session.user_id, urlDatabase),
    urls: urlDatabase,
    users: users,
    myAccount: req.session.user_id,
    user: getLoggedInUser(req, users)
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // Log the POST request body to the console
  let randomname = generateRandomString();
  urlDatabase[randomname] = {
    longURL:  req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect(`/urls/${randomname}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL; //keys
  const longURL = urlDatabase[shortURL].longURL; //values
  const templateVars = {
    shortURL,
    longURL,
    users: users,
    user: getLoggedInUser(req, users)
  };

  if (urlDatabase[shortURL].userID !== req.session.user_id) {
    return res.status(400).send("Not authorized");
  }
  
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

/*
* register
*/

app.get("/register", (req, res) => { //password get
  const templateVars = {
    urls: urlDatabase,
    users: users,
    user: getLoggedInUser(req, users)
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => { //password post

  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    return res.status(400).send("no inputs");
  } else if (findUserByEmail(email, users)) {
    return res.status(400).send("already exists");
  } else if (!getLoggedInUser(req, users)) {
    users[id] = {
      id, email, password: hashedPassword
    };
    req.session.user_id = id;
    res.redirect("/urls");
  }

});

/*
* all other urls
*/

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/*", (req, res) => {  //catch all for all other urls
  res.status(404).send("Page does not exist");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});