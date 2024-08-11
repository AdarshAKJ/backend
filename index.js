require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/userModel");
const Note = require("./models/noteModel");

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");

app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);
app.get("/", (req, res) => {
    res.json({ data: "hello" });
});

// Create Account
app.post("/create-account", async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName) {
        return res
            .status(400)
            .json({ error: true, message: "Full Name is required" });
    }

    if (!email) {
        return res
            .status(400)
            .json({ error: true, message: "Email is required" });
    }

    if (!password) {
        return res
            .status(400)
            .json({ error: true, message: "Password is required" });
    }

    const isUser = await User.findOne({
        email: email
    });

    if (isUser) {
        return res.json({
            error: true,
            message: "User already exist",
        });
    }

    const user = new User({
        fullName,
        email,
        password,
    });

    await user.save();

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
    });

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registration Successful",
    })

});

// Get User 
app.get("/get-user", authenticateToken, async (req, res) => {
    const { user } = req.user;

    const isUser = await User.findOne({ _id: user._id });

    if (!isUser) {
        return res.sendStatus(401);
    }

    const userResponse = isUser.toObject();

    delete userResponse.password;
    delete userResponse.createdOn;

    return res.json({
        user: userResponse,
        message: ""
    });

});

//login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res
            .status(400)
            .json({ message: "Email is requried" });
    }

    if (!password) {
        return res
            .status(400)
            .json({ message: "Password is requried" });
    }

    const isUser = await User.findOne({
        email: email
    });

    if (!isUser) {
        return res
            .status(400)
            .json({ message: "Either user or password is wrong" });
    }

    if (password.toString() !== isUser.password.toString()) {
        return res
            .status(400)
            .json({
                message: "Either user or password is wrong",
                error: true
            });
    }

    const user = { user: isUser };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "36000m",
    })

    return res.json({
        error: false,
        message: "Login Successful",
        email,
        accessToken,
    });

});

// Add note
app.post("/add-note", authenticateToken, async (req, res) => {
    const { title, content, tags } = req.body;
    const { user } = req.user;

    if (!title) {
        return res
            .status(400)
            .json({ error: true, massage: "Title is required" })

    }
    if (!content) {
        return res
            .status(400)
            .json({ error: true, massage: "Content is required" })

    }

    try {
        const note = await Note.create({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

        return res.json({
            error: false,
            note,
            message: "Note added successfully",
        });


    } catch (error) {
        return res
            .status(500)
            .json({
                error: true,
                message: "Internal server error",
            })
    }
});

// edit note
app.post("/edit-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if (!title && !content && !tags) {
        return res
            .status(400)
            .json({ error: true, message: "No changes provided" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note)
            return res.status(400).json({ error: true, message: "Note not found" });

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note Updated successfully",
        });

    }
    catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });

    }
});

// get all note
app.get("/all-note", authenticateToken, async (req, res) => {
    const { user } = req.user;

    try {
        const notes = await Note.find({ userId: user._id }).sort({
            isPinned: -1
        });

        return res.json({
            error: false,
            notes,
            message: "All Notes retrieved successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

// delete Note
app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { user } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        await Note.deleteOne({ _id: noteId, userId: user._id });

        return res.json({
            error: false,
            message: "Note deleted successfully",
        });

    }
    catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error"
        });
    }
});

app.post("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { user } = req.user;

    // if (!isPinned) {
    //     return res
    //         .status(400)
    //         .json({ error: true, message: "No changes provided" });
    // }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note)
            return res.status(400).json({ error: true, message: "Note not found" });

        if (isPinned) note.isPinned = isPinned;
        else note.isPinned = false;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note Updated successfully",
        });

    }
    catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });

    }
});

// search notes
app.get("/search-notes", authenticateToken, async (req, res) => {
    const { user } = req.user;
    const { query } = req.query;

    if (!query) {
        return res
            .status(400)
            .json({ error: true, message: "Search query is required" });
    }

    try {
        const matchingNotes = await Note.find({
            userId: user._id,
            $or: [
                { title: { $regex: new RegExp(query, "i") } },
                { context: { $regex: new RegExp(query, "i") } },
            ],
        });

        return res.json({
            error: false,
            notes: matchingNotes,
            message: "Notes matching the search query retrieved successfully",
        })

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});



app.listen(8000);

module.exports = app;