require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");

mongoose.connect(config.connectionString);

const express = require("express");
const cors = require("cors");
const GIFs = require("./models/GIFs");
const app = express();

app.use(express.json());

app.use(
    cors({
        origin: "*",
    })
);
app.get("/", (req, res) => {
    console.log("working");
    res.json({ data: "hello" });
});



// search notes
app.post("/api/create-gif", async (req, res) => {
    try {
        const User = await GIFs.create({
            title: req.body.title,
            url: req.body.url,
            rank: req.body.rank,
            tags: req.body.tags
        });

        return res.status(200).json({ User, message: "GIF created successfully" });

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

app.get("/api/list-gif", async (req, res) => {
    try {
        const { tags } = req.query;

        let gifs;
        if (tags) {
            // Convert tags string to array if it's a single string
            const tagsArray = tags.split(",");

            // Create a regex pattern for each tag
            const regexArray = tagsArray.map(tag => new RegExp(tag, 'i'));

            // Find GIFs that match any of the provided regex patterns in tags
            gifs = await GIFs.find({ tags: { $in: regexArray } })
                .sort({ rank: -1 });
        } else {
            // No tags provided, return all GIFs
            gifs = await GIFs.find().sort({ rank: -1 });
        }

        return res.status(200).json({ gifs });

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

app.get("/api/gif/:id", async (req, res) => {
    try {
        if (!req.params.id)
            return res.status(500).json({
                error: true,
                message: "id is requrired"
            });


        gif = await GIFs.findById(req.params.id);
        // console.log("update");
        gif.rank = gif.rank + 1;

        await gif.save();

        return res.status(200).json({ gif });

    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

app.listen(8000);

module.exports = app;