const express = require("express");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");

const app = express();


// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());

app.use(express.json());


// ==============================
// TELEGRAM BOT
// ==============================

const bot = new TelegramBot(
    process.env.TELEGRAM_BOT_TOKEN,
    {
        polling: true
    }
);


// ==============================
// TELEGRAM START
// ==============================

bot.onText(/\/start/, function(message) {

    console.log("Telegram Chat ID:", message.chat.id);

    bot.sendMessage(
        message.chat.id,
        "Security app bot is connected."
    );

});


// ==============================
// LOGIN DATA
// ==============================

let loginRequest = null;


// ==============================
// LOGIN
// ==============================

app.post("/login", function(request, response) {

    let userId = request.body.userId;


    if (!userId) {

        response.status(400).json({

            success: false,
            message: "User ID is required"

        });

        return;
    }


    loginRequest = {

        userId: userId,

        status: "pending"

    };


    console.log("New login request");

    console.log("User ID:", userId);

    console.log("Status: pending");


    response.json({

        success: true,

        message: "Waiting for approval"

    });

});


// ==============================
// LOGIN STATUS
// ==============================

app.get("/login-status", function(request, response) {

    if (loginRequest === null) {

        response.json({

            status: "none"

        });

        return;
    }


    response.json({

        status: loginRequest.status

    });

});


// ==============================
// SERVER
// ==============================

const PORT = process.env.PORT || 5000;


app.listen(PORT, function() {

    console.log(
        "Server is running on port " + PORT
    );

});