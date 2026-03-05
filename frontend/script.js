const API = "/auth";

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");

const message = document.getElementById("message");

const forgotLink = document.getElementById("forgotLink");
const backToLogin1 = document.getElementById("backToLogin1");
const backToLogin2 = document.getElementById("backToLogin2");

let resetEmail = "";


/* TAB SWITCH */

loginTab.onclick = () => showLogin();
signupTab.onclick = () => showSignup();

function showLogin(){

loginTab.classList.add("active");
signupTab.classList.remove("active");

loginForm.classList.remove("hidden");
signupForm.classList.add("hidden");
forgotForm.classList.add("hidden");
resetForm.classList.add("hidden");

message.textContent="";

}

function showSignup(){

signupTab.classList.add("active");
loginTab.classList.remove("active");

signupForm.classList.remove("hidden");
loginForm.classList.add("hidden");
forgotForm.classList.add("hidden");
resetForm.classList.add("hidden");

message.textContent="";

}


/* LOGIN */

loginForm.onsubmit = async (e)=>{

e.preventDefault();

const email = loginEmail.value;
const password = loginPassword.value;

const res = await fetch(`${API}/login`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email,password})
});

const data = await res.json();
loginForm.querySelector("button").disabled = true;
if(data.success){

localStorage.setItem("token",data.token);
setTimeout(()=>{
window.location.href="home.html";
},1000);

}

else{

message.style.color="red";
message.textContent=data.message;

}

};



/* SIGNUP */

signupForm.onsubmit = async (e)=>{

e.preventDefault();

const body = {
name:signupName.value,
email:signupEmail.value,
password:signupPassword.value,
business_type:signupBusiness.value
};

const res = await fetch(`${API}/register`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(body)
});

const data = await res.json();

if(data.success){

message.style.color="green";
message.textContent="Account created. Please login.";

showLogin();

}
else{

message.style.color="red";
message.textContent=data.message;

}

};



/* FORGOT PASSWORD */

forgotLink.onclick=()=>{
loginForm.classList.add("hidden");
forgotForm.classList.remove("hidden");
message.textContent="";
};

forgotForm.onsubmit=async(e)=>{

e.preventDefault();

resetEmail = forgotEmail.value;

const res = await fetch(`${API}/forgot-password`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({email:resetEmail})
});

const data = await res.json();

if(data.success){

message.style.color="green";
message.textContent="OTP sent to your email.";

forgotForm.classList.add("hidden");
resetForm.classList.remove("hidden");

}
else{

message.style.color="red";
message.textContent=data.message;

}

};



/* RESET PASSWORD */

resetForm.onsubmit = async(e)=>{

e.preventDefault();

const body = {
email:resetEmail,
otp:resetOtp.value,
new_password:resetPassword.value
};

const res = await fetch(`${API}/reset-password`,{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(body)
});

const data = await res.json();

if(data.success){

message.style.color="green";
message.textContent="Password reset successful. Please login.";

showLogin();

}
else{

message.style.color="red";
message.textContent=data.message;

}

};


backToLogin1.onclick=showLogin;
backToLogin2.onclick=showLogin;