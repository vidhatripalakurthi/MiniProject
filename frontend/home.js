document.addEventListener("DOMContentLoaded", () => {

let selectedFile = null;

const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("datasetFile");
const uploadContainer = document.getElementById("uploadContainer");
const uploadBtn = document.getElementById("uploadBtn");
const rawPreviewContainer = document.getElementById("rawPreviewContainer");
const rawTable = document.getElementById("rawTable");
const cleanBtn = document.getElementById("cleanDataBtn");


// -----------------------------
// FILE PICKER
// -----------------------------

uploadArea.addEventListener("click", () => {
    fileInput.click();
});

fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];
    if (!file) return;

    selectedFile = file;

    uploadContainer.innerHTML = `
        <div class="file-selected">
            <span>${file.name}</span>
            <span class="remove-file" id="removeFileBtn">✕</span>
        </div>
    `;

    document.getElementById("removeFileBtn").addEventListener("click", () => {
        location.reload();
    });

});


// -----------------------------
// PREVIEW DATASET
// -----------------------------

uploadBtn.addEventListener("click", (e) => {

    e.preventDefault();

    if (!selectedFile) {
        alert("Select dataset first");
        return;
    }

    const reader = new FileReader();

    reader.onload = (ev) => {

        const rows = ev.target.result.split("\n").slice(0, 15);

        let table = "<div class='table-wrapper'><table class='data-table'><tbody>";

        rows.forEach(row => {

            table += "<tr>";

            row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).forEach(col => {
                table += `<td>${col}</td>`;
            });

            table += "</tr>";

        });

        table += "</tbody></table></div>";

        rawPreviewContainer.style.display = "block";
        rawTable.innerHTML = table;

    };

    reader.readAsText(selectedFile);

});


// -----------------------------
// CLEAN DATA
// -----------------------------

cleanBtn.addEventListener("click", async (e) => {

    e.preventDefault();

    if (!selectedFile) {
        alert("Upload dataset first");
        return;
    }

    cleanBtn.innerText = "Processing...";
    cleanBtn.disabled = true;

    try {

        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append("file", selectedFile);

        const res = await fetch("http://127.0.0.1:5000/upload-dataset", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || "Dataset preprocessing failed");
            cleanBtn.innerText = "Clean Data";
            cleanBtn.disabled = false;
            return;
        }

        localStorage.setItem("cleanData", JSON.stringify(data));

        window.location.href = "cleandata.html";

    } catch (error) {

        console.error("Fetch error:", error);
        alert("Server error during preprocessing");

        cleanBtn.innerText = "Clean Data";
        cleanBtn.disabled = false;

    }

});

});