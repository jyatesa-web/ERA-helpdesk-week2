require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const {connectMongo} = require("./mongo");

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
    res.json({ message: "ERA Tech Solutions Helpdesk API is running"});
});

// start Server - wait for mongodb before listening
async function startServer() {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`server running at http://localhost:${PORT}`);
    });
}

// get/departments
app.get("/departments", (req, res) => {
    const sql = "SELECT * FROM departments";
    db.query(sql, (error, results) => {
        if(error) {
            console.error("Error getting departments:", error);
            return res.status(500).json({error: "failed to get departments"});
        }
        res.json(results);
    });
});

// get/users-returns all users (password excluded)
app.get("/users", (req, res) => {
    const sql = "SELECT id, first_name, last_name, email, role, department_id FROM users";
    db.query(sql, (error, results) => {
        if(error) {
            console.error("Error getting users:", error);
            return res.status(500).json({error: "failed to get users"});
        }
        res.json(results);
    });
});

startServer();