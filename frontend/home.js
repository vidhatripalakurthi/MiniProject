// -------------------------------
// FILE UPLOAD AREA HANDLING
// -------------------------------

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("datasetFile");

if (uploadArea && fileInput) {

uploadArea.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", handleFile);

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.style.background = "#eef4ff";
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.style.background = "#f6f9ff";
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    validateFile(file);
});
}

// -------------------------------
// HANDLE FILE SELECT
// -------------------------------

function handleFile() {
const file = fileInput.files[0];
validateFile(file);
}

// -------------------------------
// FILE VALIDATION
// -------------------------------

function validateFile(file) {

if (!file) return;

const allowed = ["csv", "xlsx", "xls"];

const ext = file.name.split(".").pop().toLowerCase();

if (!allowed.includes(ext)) {
    alert("Only CSV or Excel files are allowed.");
    fileInput.value = "";
    return;
}

alert("Dataset selected: " + file.name);

// After validation upload automatically
uploadDataset(file);

}

// -------------------------------
// DATASET UPLOAD API CALL
// -------------------------------

async function uploadDataset(file){

try{

const token = localStorage.getItem("token");

if(!token){
    alert("You are not logged in.");
    window.location.href = "index.html";
    return;
}

const formData = new FormData();
formData.append("file", file);

const response = await fetch("http://127.0.0.1:5000/upload-dataset",{
    method: "POST",
    headers:{
        "Authorization": "Bearer " + token
    },
    body: formData
});

const data = await response.json();

if(response.ok){

    alert("Dataset uploaded successfully!");

    console.log("Upload response:", data);

}else{

    alert("Upload failed: " + data.message);

}

}catch(error){

console.error("Upload error:",error);
alert("Something went wrong while uploading dataset.");

}

}

// -------------------------------
// LOGOUT BUTTON
// -------------------------------

const logoutBtn = document.getElementById("logoutBtn");

if(logoutBtn){

logoutBtn.onclick = () => {

localStorage.removeItem("token");

window.location.href = "index.html";

};

}