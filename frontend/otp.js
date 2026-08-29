const verifyBtn = document.getElementById("verifyBtn");

verifyBtn.addEventListener("click", verifyOTP);


function verifyOTP(){

    let otp = document.getElementById("otp").value;


    if(otp === ""){

        document.getElementById("message").textContent =
        "Please enter the OTP";

        return;
    }


    if(otp.length !== 6){

        document.getElementById("message").textContent =
        "OTP must be 6 digits";

        return;
    }


    fetch("https://security-app-backend-v019.onrender.com/verify-otp", {

    method: "POST",

    headers: {

        "Content-Type": "application/json"

    },

    body: JSON.stringify({

        otp: otp

    })

})
    .then(function(response){

        return response.json();

    })
    .then(function(data){

        document.getElementById("message").textContent =
        data.message;


        if(data.success){

            window.location.href = "/home.html";

        }

    });

}