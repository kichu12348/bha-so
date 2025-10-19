const express = require("express");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static("public"));

app.get("/", (req, res) => {
  db.all("SELECT * FROM clubs ORDER BY created_at DESC", (err, clubs) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else {
      res.render("index", { clubs, title: "College Club Management" });
    }
  });
});

app.get("/clubs/new", (req, res) => {
  res.render("new", { title: "Add New Club" });
});

app.post("/clubs", (req, res) => {
  const { name, description, category, president, email, members_count } =
    req.body;

  db.run(
    "INSERT INTO clubs (name, description, category, president, email, members_count) VALUES (?, ?, ?, ?, ?, ?)",
    [name, description, category, president, email, members_count || 0],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).send("Error creating club");
      } else {
        res.redirect("/");
      }
    }
  );
});

app.get("/clubs/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM clubs WHERE id = ?", [id], (err, club) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else if (!club) {
      res.status(404).send("Club not found");
    } else {
      res.render("show", { club, title: club.name });
    }
  });
});

app.get("/clubs/:id/edit", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM clubs WHERE id = ?", [id], (err, club) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else if (!club) {
      res.status(404).send("Club not found");
    } else {
      res.render("edit", { club, title: "Edit Club" });
    }
  });
});

app.put("/clubs/:id", (req, res) => {
  const id = req.params.id;
  const { name, description, category, president, email, members_count } =
    req.body;

  db.run(
    "UPDATE clubs SET name = ?, description = ?, category = ?, president = ?, email = ?, members_count = ? WHERE id = ?",
    [name, description, category, president, email, members_count, id],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).send("Error updating club");
      } else {
        res.redirect(`/clubs/${id}`);
      }
    }
  );
});

app.delete("/clubs/:id", (req, res) => {
  const id = req.params.id;

  db.run("DELETE FROM clubs WHERE id = ?", [id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).send("Error deleting club");
    } else {
      res.redirect("/");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Database connection closed.");
    }
    process.exit(0);
  });
});
