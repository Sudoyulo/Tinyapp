const { response } = require("express");
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/login", (req, res) => { ///header

  res.cookie("username", req.body.username);

  res.redirect("/urls");
});

app.post("/logout", (req, res) => { ///header

  res.clearCookie("username");

  res.redirect("/urls");
});


app.get("/urls", (req, res) => {

  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"]
  };
  console.log(templateVars)
  res.render("urls_index", templateVars);
});

app.get("/urls/new/", (req, res) => {  // the / at the end means something... forgot what

  const templateVars = { urls: urlDatabase,
    username: req.cookies["username"]
  };

  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {

  // console.log("this is the pair",req.body);  // Log the POST request body to the console
  let randomname = generateRandomString();
  urlDatabase[randomname] = req.body.longURL;
  res.redirect(`/urls/${randomname}`);         // Respond with 'Ok' (we will replace this)

});

app.get("/urls/:shortURL", (req, res) => {

  //console.log(req.params)
  const shortURL = req.params.shortURL; //keys
  const longURL = urlDatabase[shortURL]; //values
  const templateVars = { shortURL,
    longURL,
    username: req.cookies["username"], };

  urlDatabase[req.params.shortURL] = longURL;
  // console.log("sadsa",{urlDatabase});
  res.render("urls_show", templateVars);

});

app.post("/urls/:shortURL", (req, res) => { ///after edit
  
  urlDatabase[req.params.shortURL] = req.body.newURL;
  res.redirect(`/urls/`);
});


app.post("/urls/:shortURL/delete", (req, res) => {  //delete?

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {

  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);

});

app.get("/root/:airplane/:train/:boat", (req,res) => {
  // console.log(req.params); //req params is the url. one param is one :/
  //saves as an object {airplane: /url link, train:/url/url, boat...}
  res.send("hello"); //body is in the last location (3 files in)
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});