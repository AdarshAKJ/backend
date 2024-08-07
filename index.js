require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const User = require("./models/userModel");

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

// create
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

    if (password !== isUser.password) {
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

})

app.get("/", (req, res) => {
    res.json({ data: "hello" });
});

app.listen(8000);

module.exports = app;