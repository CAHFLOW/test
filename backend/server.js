```js
const express = require("express");
const cors = require("cors");

const app = express();


// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());
app.use(express.json());


// ==============================
// HOME
// ==============================

app.get("/", function(request, response) {

    response.send("Backend is running");

});


// ==============================
// LOGIN DATA
// ==============================

let loginRequest = null;


// ==============================
// LOGIN
// ==============================

app.post("/login", function(request, response) {

    let phone = request.body.phone;
    let pin = request.body.pin;

    if (!phone || !pin) {

        response.status(400).json({
            success: false,
            message: "Phone and PIN are required"
        });

        return;
    }

    loginRequest = {
        phone: phone,
        status: "pending"
    };

    console.log("New demo login request");
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
// DEMO APPROVAL
// ==============================

app.post("/approve-demo", function(request, response) {

    if (loginRequest === null) {

        response.json({
            success: false,
            message: "No login request"
        });

        return;
    }

    loginRequest.status = "approved";

    console.log("Demo login approved");

    response.json({
        success: true,
        message: "Demo request approved"
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
```
