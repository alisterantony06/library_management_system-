const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456789",
  database: "library_db"
});

db.connect(err => {
  if (err) {
    console.log("❌ MySQL Error:", err);
    return;
  }
  console.log("✅ MySQL Connected");
});


// 📌 Add Book
app.post("/add-book", (req, res) => {
  const { title, author, student_name, issue_date, return_date } = req.body;

  const sql = `
    INSERT INTO books
    (title, author, student_name, issue_date, return_date, status, fine)
    VALUES (?, ?, ?, ?, ?, 'Issued', 0)
  `;

  db.query(sql, [title, author, student_name, issue_date, return_date], err => {
    if (err) {
      console.log(err);
      return res.json({ error: true });
    }
    res.json({ success: true });
  });
});


// 📌 Get All Books
app.get("/books", (req, res) => {
  db.query("SELECT * FROM books", (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    res.json(result);
  });
});


// 📌 Delete Book
app.delete("/delete-book/:id", (req, res) => {
  db.query(
    "DELETE FROM books WHERE id=?",
    [req.params.id],
    err => {
      if (err) {
        console.log(err);
        return res.json({ error: true });
      }
      res.json({ success: true });
    }
  );
});


// 📌 Update Book
app.put("/update-book/:id", (req, res) => {
  const { title, author } = req.body;

  db.query(
    "UPDATE books SET title=?, author=? WHERE id=?",
    [title, author, req.params.id],
    err => {
      if (err) {
        console.log(err);
        return res.json({ error: true });
      }
      res.json({ success: true });
    }
  );
});


// 📌 Return Book + Fine Calculation (SAFE)
app.put("/return-book/:id", (req, res) => {
  db.query(
    "SELECT return_date FROM books WHERE id=?",
    [req.params.id],
    (err, result) => {
      if (err || result.length === 0) {
        console.log(err);
        return res.json({ error: true });
      }

      let fine = 0;

      if (result[0].return_date) {
        const today = new Date();
        const returnDate = new Date(result[0].return_date);

        if (today > returnDate) {
          const daysLate = Math.ceil(
            (today - returnDate) / (1000 * 60 * 60 * 24)
          );
          fine = daysLate * 5; // ₹5 per day
        }
      }

      db.query(
        "UPDATE books SET status='Available', fine=?, student_name=NULL WHERE id=?",
        [fine, req.params.id],
        err => {
          if (err) {
            console.log(err);
            return res.json({ error: true });
          }
          res.json({ success: true });
        }
      );
    }
  );
});


// 📗 Available Books (VIEW)
app.get("/books/available", (req, res) => {
  db.query("SELECT * FROM view_available_books", (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    res.json(result);
  });
});


// 📕 Issued Books (VIEW)
app.get("/books/issued", (req, res) => {
  db.query("SELECT * FROM view_issued_books", (err, result) => {
    if (err) {
      console.log(err);
      return res.json([]);
    }
    res.json(result);
  });
});


// 🚀 Start Server
app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});