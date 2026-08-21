require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const {connectMongo, getMongo} = require("./mongo");

const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());

// Root Route
app.get("/", (req, res) => {
    res.json({ message: "ERA Tech Solutions Helpdesk API is running"});
});

// MYSQL routes------------------------


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

// get/tickets
app.get("/tickets", (req, res) => {
    const sql = "SELECT * FROM tickets";
    db.query(sql, (error, results) => {
        if(error) {
            console.error("Error getting tickets:", error);
            return res.status(500).json({error: "failed to get tickets"});
        }
        res.json(results);
    });
});

// get/tickets/open-returns only opened tickets
app.get("/tickets/open", (req, res) => {
    const sql = "SELECT * FROM tickets WHERE status = 'open'";
    db.query(sql, (error, results) => {
        if(error) {
            console.error("Error getting open tickets:", error);
            return res.status(500).json({error: "failed to get open tickets"});
        }
        res.json(results);
    });
});

// get/tickets/:id
app.get("/tickets/:id", (req, res) => {
    const ticketId = req.params.id;
    const sql = "SELECT * FROM tickets WHERE id = ?";
    db.query(sql, [ticketId], (error, results) => {
        if(error) {
            console.error("Error getting ticket:", error);
            return res.status(500).json({error: "failed to get ticket"});
        }
        if(results.length === 0) {
            return res.status(404).json({error: "ticket not found"});
        }
        res.json(results[0]);
    });
});

// post/users - creates a new user
app.post("/users", (req, res) => {
    const {first_name, last_name, email, password, role, department_id} = req.body;
    
    // check required fields
    if(!first_name || !last_name || !email || !password){
        return res.status(400).json({error: "first_name, last_name, email, and password are required"});
    }
    
    // password rule #1: minimum 8 characters
    if(password.length <8){
        return res.status(400).json({error: "password must be at least 8 characters long"});
    }
    
    // password rule #2: at least one special character
    const specialChar = /[!@#$%]/;
    if (!specialChar.test(password)){
        return res.status(400).json({error: "password must include one special character:! @ # $ %"});
    }
    const sql = "INSERT INTO users (first_name, last_name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?, ?)";
    const userRole = role || "employee";
    const deptId = department_id || null;
    
    db.query(sql,[first_name, last_name, email, password, userRole, deptId], (error, results) => {
        if(error){
            console.error("error creating user:", error);
            return res.status(500).json({error: "failed to creat user"});
        }
        res.status(201).json({message: "user created successfully", userId: results.insertId});
    });
});

// MONGODB ROUTES ------------------------------------

// get/ticket-notes - returns all ticket notes from mongodb
app.get("/ticket-notes", async (req, res) => {
    try {
        const mongoDb = getMongo();
        const notes = await mongoDb.collection("ticket_notes").find({}).toArray();
        res.json(notes);
    } catch(error) {
        console.error("Error getting ticket notes:", error);
        res.status(500).json({error: "failed to get ticket notes"});
    }
});

// get/ticket-note/:ticketId - returns notes for a specific ticket
app.get("/ticket-notes/:ticketId", async (req, res) => {
    try {
        const ticketId = parseInt(req.params.ticketId);
        const mongoDb = getMongo();
        const notes = await mongoDb.collection("ticket_notes").find({ticket_id: ticketId}).toArray();
        res.json(notes);
    } catch(error){
        console.error("error getting notes for ticket:", error);
        res.status(500).json({error: "failed to get ticket notes"});
    }
});

// get/activity-logs - returns all activity logs from MongoDB
app.get("/activity-logs", async (req, res) => {
    try {
        const mongoDb = getMongo();
        const logs = await mongoDb.collection("activity_logs").find({}).sort({timestamp: -1}).toArray();
        res.json(logs);
    }catch(error){
        console.error("error getting activity logs:", error);
        res.status(500).json({error: "failed to get activity logs"});
    }
});

// start Server - wait for mongodb before listening
async function startServer() {
    await connectMongo();
    app.listen(PORT, () => {
        console.log(`server running at http://localhost:${PORT}`);
    });
}
startServer();