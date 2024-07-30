const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  // Returns boolean to check if the username is valid
  return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => {
  // Returns boolean to check if username and password match the one we have in records
  return users.some(user => user.username === username && user.password === password);
}

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Create JWT
  const accessToken = jwt.sign({ username }, 'your_secret_key', { expiresIn: '1h' });
  return res.status(200).json({ message: "Login successful", token: accessToken });
});

// Middleware to authenticate JWT
//const authenticateJWT = (req, res, next) => {
  //const authHeader = req.headers.authorization;

  //if (authHeader) {
    //const token = authHeader.split(' ')[1];

    //jwt.verify(token, 'your_secret_key', (err, user) => {
      //if (err) {
        //return res.sendStatus(403);
      //}

      //req.user = user;
      //next();
    //});
  //} else {
    //res.sendStatus(401);
  //}
//};

// Add or modify a book review
regd_users.put("/auth/review/:isbn", authenticateJWT, (req, res) => {
  const isbn = req.params.isbn;
  const { review } = req.query;

  if (!review) {
    return res.status(400).json({ message: "Review content is required" });
  }

  const username = req.user.username;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (!book.reviews) {
    book.reviews = {};
  }

  book.reviews[username] = review;
  return res.status(200).json({ message: "Review added/updated successfully", reviews: book.reviews });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", authenticateJWT, (req, res) => {
  const isbn = req.params.isbn;
  const username = req.user.username;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  if (book.reviews && book.reviews[username]) {
    delete book.reviews[username];
    return res.status(200).json({ message: "Review deleted successfully", reviews: book.reviews });
  } else {
    return res.status(404).json({ message: "Review not found" });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
