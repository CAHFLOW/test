const express = require("express");

const app = express();

let loginRequest = null;
let currentOTP = null;
let otpExpiresAt = null;
let otpAttempts = 0;


// Allow Express to read JSON
app.use(express.json());


// Serve frontend files
app.use(express.static("../frontend"));


// ==============================
// LOGIN
// ==============================

app.post("/login", function(request, response){

    let phone = request.body.phone;
    let pin = request.body.pin;


    if(!phone || !pin){

        response.status(400).json({

            success: false,
            message: "Phone and PIN are required"

        });

        return;
    }


    loginRequest = {

        phone: phone,
        pin: pin,
        status: "pending"

    };


    console.log("New login request");
    console.log("Phone:", phone);
    console.log("Status:", loginRequest.status);


    response.json({

        success: true,
        message: "Waiting for approval"

    });

});


// ==============================
// LOGIN STATUS
// ==============================

app.get("/login-status", function(request, response){

    if(loginRequest === null){

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
// VERIFY OTP
// ==============================

app.post("/verify-otp", function(request, response){

    let otp = request.body.otp;


    if(!currentOTP){

        response.json({

            success: false,
            message: "No active OTP"

        });

        return;
    }


    // Check OTP expiration
    if(Date.now() > otpExpiresAt){

        currentOTP = null;
        otpExpiresAt = null;
        otpAttempts = 0;

        response.json({

            success: false,
            message: "OTP has expired"

        });

        return;
    }


    // Check OTP
    if(otp === String(currentOTP)){

        console.log("OTP verified successfully");


        currentOTP = null;
        otpExpiresAt = null;
        otpAttempts = 0;


        response.json({

            success: true,
            message: "OTP correct"

        });

        return;
    }


    // Wrong OTP
    otpAttempts++;


    if(otpAttempts >= 3){

        currentOTP = null;
        otpExpiresAt = null;
        otpAttempts = 0;


        response.json({

            success: false,
            message: "Too many incorrect attempts"

        });

        return;
    }


    response.json({

        success: false,

        message:
        "Wrong OTP. Attempts remaining: " +
        (3 - otpAttempts)

    });

});


// ==============================
// SERVER
// ==============================

const PORT = process.env.PORT || 5000;


app.listen(PORT, function(){

    console.log(
        "Server is running on port " + PORT
    );

});