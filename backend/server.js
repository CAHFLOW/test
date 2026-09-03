const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// ==============================
// TELEGRAM SETTINGS
// ==============================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;


// ==============================
// DEMO LOGIN DETAILS
// ==============================

// Fake values for presentation only
const DEMO_PHONE = "0712 345 678";
const DEMO_PIN = "1234";
const DEMO_OTP = "123456";


// ==============================
// LOGIN DATA
// ==============================

let loginRequest = null;


// ==============================
// TELEGRAM API FUNCTION
// ==============================

async function telegramRequest(method, data) {

    const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );

    return await response.json();
}


// ==============================
// HOME
// ==============================

app.get("/", function(request, response) {

    response.send("Backend is running");

});


// ==============================
// LOGIN
// ==============================

app.post("/login", async function(request, response) {

    let phone = request.body.phone;
    let pin = request.body.pin;


    if (!phone || !pin) {

        response.status(400).json({

            success: false,
            message: "Please enter demo phone and PIN"

        });

        return;
    }


    // Check demo credentials

    if (phone !== DEMO_PHONE || pin !== DEMO_PIN) {

        response.json({

            success: false,
            message: "Use the demo phone and demo PIN"

        });

        return;
    }


    // Create login request

    loginRequest = {

        id: Date.now(),

        phone: DEMO_PHONE,

        status: "pending",

        createdAt: Date.now()

    };


    console.log("New demo login request");
    console.log("Demo phone:", DEMO_PHONE);
    console.log("Request ID:", loginRequest.id);


    // ==============================
    // SEND LOGIN REQUEST TO TELEGRAM
    // ==============================

    try {

        await telegramRequest("sendMessage", {

            chat_id: ADMIN_CHAT_ID,

            text:
                "🔔 NEW DEMO LOGIN REQUEST\n\n" +
                "Phone: " + DEMO_PHONE +
                "\nDemo PIN: " + DEMO_PIN +
                "\nRequest ID: " + loginRequest.id +
                "\n\nPlease choose an action:",

            reply_markup: {

                inline_keyboard: [

                    [
                        {
                            text: "✅ Approve",

                            callback_data:
                                "approve_" + loginRequest.id
                        },

                        {
                            text: "❌ Reject",

                            callback_data:
                                "reject_" + loginRequest.id
                        }
                    ]

                ]

            }

        });

        console.log("Telegram notification sent");

    } catch (error) {

        console.log("Telegram error:", error);

    }


    response.json({

        success: true,

        message: "Waiting for admin approval"

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
// TELEGRAM BUTTON HANDLER
// ==============================

async function handleTelegramButton(callbackQuery) {

    let chatId = callbackQuery.message.chat.id;


    // Only admin can approve/reject

    if (String(chatId) !== String(ADMIN_CHAT_ID)) {

        await telegramRequest("answerCallbackQuery", {

            callback_query_id: callbackQuery.id,

            text: "Not authorized"

        });

        return;
    }


    if (loginRequest === null) {

        await telegramRequest("answerCallbackQuery", {

            callback_query_id: callbackQuery.id,

            text: "No active login request"

        });

        return;
    }


    // Get command and request ID

    let parts = callbackQuery.data.split("_");

    let command = parts[0];

    let requestId = parts[1];


    // Check request ID

    if (String(requestId) !== String(loginRequest.id)) {

        await telegramRequest("answerCallbackQuery", {

            callback_query_id: callbackQuery.id,

            text: "This request is no longer active"

        });

        return;
    }


    // ==============================
    // 5 MINUTE ADMIN WINDOW
    // ==============================

    let timePassed =
        Date.now() - loginRequest.createdAt;


    if (timePassed > 5 * 60 * 1000) {

        loginRequest.status = "expired";


        await telegramRequest("answerCallbackQuery", {

            callback_query_id: callbackQuery.id,

            text: "Request expired"

        });

        return;
    }


    // ==============================
    // APPROVE
    // ==============================

    if (command === "approve") {

        loginRequest.status = "approved";


        await telegramRequest("answerCallbackQuery", {

            callback_query_id: callbackQuery.id,

            text: "Login approved ✅"

        });


        await telegramRequest("editMessageText", {

            chat_id: ADMIN_CHAT_ID,

            message_id:
                callbackQuery.message.message_id,

            text:
                "✅ DEMO LOGIN APPROVED\n\n" +
                "Phone: " + DEMO_PHONE +
                "\nDemo PIN: " + DEMO_PIN +
                "\nDemo OTP: " + DEMO_OTP +
                "\nRequest ID: " + loginRequest.id +
                "\n\nThe user can now enter the demo OTP."

        });


        console.log("Login approved");

    }


    // ==============================
    // REJECT
    // ==============================

    if (command === "reject") {

        loginRequest.status = "rejected";


        await telegramRequest("answerCallbackQuery", {

            callback_query_id: callbackQuery.id,

            text: "Login rejected ❌"

        });


        await telegramRequest("editMessageText", {

            chat_id: ADMIN_CHAT_ID,

            message_id:
                callbackQuery.message.message_id,

            text:
                "❌ DEMO LOGIN REJECTED\n\n" +
                "Phone: " + DEMO_PHONE +
                "\nRequest ID: " + loginRequest.id

        });


        console.log("Login rejected");

    }

}


// ==============================
// TELEGRAM POLLING
// ==============================

async function startTelegramPolling() {

    if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {

        console.log(
            "Telegram environment variables are missing"
        );

        return;
    }


    console.log("Telegram bot starting...");


    await telegramRequest("deleteWebhook", {

        drop_pending_updates: false

    });


    let offset = 0;


    while (true) {

        try {

            let result = await telegramRequest(

                "getUpdates",

                {
                    offset: offset,

                    timeout: 20
                }

            );


            if (result.ok) {

                for (let update of result.result) {

                    offset =
                        update.update_id + 1;


                    if (update.callback_query) {

                        await handleTelegramButton(
                            update.callback_query
                        );

                    }

                }

            }

        } catch (error) {

            console.log(
                "Telegram polling error:",
                error
            );


            await new Promise(function(resolve) {

                setTimeout(resolve, 3000);

            });

        }

    }

}


// ==============================
// DEMO OTP
// ==============================

app.post("/verify-otp", function(request, response) {

    let otp = request.body.otp;


    // User must be approved first

    if (
        loginRequest === null ||
        loginRequest.status !== "approved"
    ) {

        response.json({

            success: false,

            message: "Login has not been approved"

        });

        return;
    }


    // Check demo OTP

    if (otp === DEMO_OTP) {

        response.json({

            success: true,

            message: "OTP verified successfully"

        });

        return;
    }


    response.json({

        success: false,

        message: "Incorrect demo OTP"

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


    startTelegramPolling();

});