/**
 * This examples shows how to make a "Login with pies.cf" feature using express.js and ejs
 * You should change this to fit how your app needs.
 * 
 * This example uses AccountID and AccountUsername intents you can add more as you need.
 * Make sure to set redirect_uri_agreed to http://localhost/ (This will have ?code=... appended to it)
 * Make sure to set redirect_uri_denied to http://localhost/?auth_failed=1 (This will have no code and will show our error)
 * Change localhost and http if you are running off another host
 */

// Configure .env file
require("dotenv").config()

// Imports
const express = require("express")
const PiesSDK = require("./sdk")
const app = express()

// Create an PiesSDK instance using your API_KEY
const api = new PiesSDK(process.env.API_KEY)

// Set the view engine to ejs
app.set("view engine", "ejs")

// Import cookie parser so we can read cookies 
app.use(require("cookie-parser")())

// Get your apps AUTH_URL and store it for later
// Change #loading for another page if you wish, this is just a placeholder value while it fetchs from the api
let auth_url = "#loading"
api.getAppInfo().then(appInfo => {
  auth_url = appInfo.auth_url
}).catch(err => {
  // Log error and put some custom logic for your error page. Here we will just use #error 
  console.log(err)
  auth_url = "#error"
})

// This middleware will render the login page if you are not logged in, otherwise continue to whatever data you have
// We will also pass the auth_url to our page to render in our redirect
app.use(async (req, res, next) => {
  // If there is a code in the query we can add it to their cookie and redirect them back to /
  if (req.query.code) {
    res.cookie("code", req.query.code)
    res.redirect("/")
    return
  }

  // If the query contains auth_failed = 1 we can show an error page
  if (req.cookies.code == undefined) {
    res.render("login.ejs", { auth_url, text: "Failed to login." })
    return
  }

  // First check if they have a cookie, if they do not show the login page
  if (req.cookies.code == undefined) {
    res.render("login.ejs", { auth_url })
    return
  }

  // If they do we can attempt to request the api
  try {
    const account = await api.getAccountInfo(req.cookies.code)
    
    // We will how have access to some properties of the user
    // To use this in later code we can store it in req.user
    req.user = account
    
    // Call next() to continue to the rest of our app
    next()
  } catch (e) {
    // If there was an error we can assume the code is invalid and ask the user to renew their access token
    return res.render("login.ejs", { auth_url, text: "Invalid session, please renew." })
  }
})

// If the user wishes to log out we can clear the code cookie and redirect them to /
app.get("/logout", (req,res) => {
  res.clearCookie("code")
  res.redirect("/")
})

// We can show some example infomation on here
// You can implement your own logic here
app.get("/", (req,res) => {
  res.send(`
    <span>Hello ${req.user.username}! Your account ID is ${req.user.id}</span><br>
    <a href="/logout">Logout</a>
  `)
})

// Finally we will listen for http requests on port 80
app.listen(80, () => {
  console.log("login with pies.cf example is online at :80")
})