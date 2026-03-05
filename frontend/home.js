// FILE UPLOAD

const uploadArea=document.getElementById("uploadArea");
const fileInput=document.getElementById("datasetFile");
if(uploadArea && fileInput){
uploadArea.addEventListener("click",()=>{
fileInput.click();
});

fileInput.addEventListener("change",handleFile);

uploadArea.addEventListener("dragover",(e)=>{
e.preventDefault();
uploadArea.style.background="#eef4ff";
});

uploadArea.addEventListener("dragleave",()=>{
uploadArea.style.background="#f6f9ff";
});

uploadArea.addEventListener("drop",(e)=>{
e.preventDefault();

const file=e.dataTransfer.files[0];
validateFile(file);
});
}
function handleFile(){
const file=fileInput.files[0];
validateFile(file);
}

function validateFile(file){

if(!file) return;

const allowed=["csv","xlsx","xls"];

const ext=file.name.split(".").pop().toLowerCase();

if(!allowed.includes(ext)){
alert("Only CSV or Excel files are allowed.");
fileInput.value="";
return;
}

alert("Dataset selected: "+file.name);

}


// LOGOUT BUTTON

document.getElementById("logoutBtn").onclick=()=>{

localStorage.removeItem("token");

window.location.href="index.html";

};