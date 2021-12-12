const { response } = require("express");
const express = require("express");
const cookieSession = require('cookie-session');
const {findUserByEmail, reduceUrlDatabase, getLoggedInUser } = require("./helpers");
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["user_id"],
}));

app.set("view engine", "ejs");

const generateRandomString = () => { //generate a unique 6 character string
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
    viewCount: 0,
    viewedBy: [],
    date: new Date()
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
    viewCount: 0,
    viewedBy: [],
    date: new Date()
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

app.get("/", (req, res) => { //send back to urls
  res.redirect("/urls");
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
 
  if (req.body.email === "" || req.body.password === "") {
    return res.status(400).send("No input detected");
  }

  const email = req.body.email;
  const userID = findUserByEmail(email, users);

  if (!userID) {
    return res.status(400).send("No such user");
  }

  if (!bcrypt.compareSync(req.body.password, users[userID]["password"])) {
    return res.status(403).send("Bad password");
  }
  
  if (userID && bcrypt.compareSync(req.body.password, users[userID]["password"])) {
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

/*
* URLs main
*/

app.get("/urls/new", (req, res) => {

  if (getLoggedInUser(req, users) === null) {
    return res.redirect("/login");
  } else {
    const templateVars = {
      urls: urlDatabase,
      users: users,
      user: getLoggedInUser(req, users)
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    reduced: reduceUrlDatabase(req.session.user_id, urlDatabase),
    user: getLoggedInUser(req, users),
    urls: urlDatabase,
    users: users,
    myAccount: req.session.user_id,
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // Log the POST request body to the console
  let randomname = generateRandomString();
  urlDatabase[randomname] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
    viewCount: 0,
    viewedBy: [],
    date: new Date()
  };
  res.redirect(`/urls/${randomname}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL; //keys
  const longURL = urlDatabase[shortURL].longURL; //values
  const uniqueViewer = urlDatabase[shortURL].viewedBy.includes(req.session.user_id);
  urlDatabase[shortURL].viewCount++;

  if (!uniqueViewer) {
    urlDatabase[shortURL].viewedBy.push(req.session.user_id);
  }

  const templateVars = {
    user: getLoggedInUser(req, users),
    shortURL,
    longURL,
    urls: urlDatabase,
    users: users,
    viewedBy: urlDatabase[shortURL].viewedBy,
    date: urlDatabase[shortURL].date,
    sessionID: req.session.user_id,
    myAccount: urlDatabase[shortURL].userID
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => { ///after edit
  urlDatabase[req.params.shortURL]["longURL"] = req.body.newURL;
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL/delete", (req, res) => { //if not user then cant delete****
  if (getLoggedInUser(req, users) === null) {
    return res.redirect("/login");
  } else {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect(`/urls`);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]["longURL"]) {
    return res.redirect(urlDatabase[req.params.shortURL]["longURL"]);
  }
  res.status(404).send("Page Not Found");
});

/*
* register
*/

app.get("/register", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    users: users,
    user: getLoggedInUser(req, users)
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    return res.status(400).send("no inputs");
  } else if (findUserByEmail(email, users)) { //email exists in user database
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