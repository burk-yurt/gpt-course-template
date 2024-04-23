/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: true }));
app.use(express.json());  // Make sure to use express.json() to parse JSON-bodied requests

app.post('/generate', (req, res) => {
  // Example processing, replace with your logic
  const inputText = req.body.text;
  const generatedText = `Generated text based on: ${inputText}`;
  res.json({ text: generatedText });
});

exports.api = functions.https.onRequest(app);


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
