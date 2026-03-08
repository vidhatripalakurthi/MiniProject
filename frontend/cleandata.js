let cleanedData = null;
let cleanedFileName = null;

document.addEventListener("DOMContentLoaded", () => {

    const stored = localStorage.getItem("cleanData");

    if (!stored) {

        document.getElementById("cleanTableContainer").innerHTML =
        "<p>No cleaned data found. Please return to dashboard.</p>";

        return;
    }

    cleanedData = JSON.parse(stored);

    if (!cleanedData.preview || cleanedData.preview.length === 0) {

        document.getElementById("cleanTableContainer").innerHTML =
        "<p>No preview available</p>";

        return;
    }

    renderCleanTable(cleanedData.preview);

    document.getElementById("metaRows").innerText = cleanedData.rows;

    document.getElementById("metaProducts").innerText =
        cleanedData.products.length;

    document.getElementById("metaStart").innerText =
        cleanedData.date_range.start;

    document.getElementById("metaEnd").innerText =
        cleanedData.date_range.end;

    cleanedFileName = cleanedData.clean_file;

});


function renderCleanTable(data) {

    const container = document.getElementById("cleanTableContainer");

    const cols = Object.keys(data[0]);

    let table = "<div class='table-wrapper'><table class='data-table'><thead><tr>";

    cols.forEach(col => {
        table += `<th>${col}</th>`;
    });

    table += "</tr></thead><tbody>";

    data.slice(0, 15).forEach(row => {

        table += "<tr>";

        cols.forEach(col => {
            table += `<td>${row[col]}</td>`;
        });

        table += "</tr>";

    });

    table += "</tbody></table></div>";

    container.innerHTML = table;

}


// download dataset
document.getElementById("downloadCleanBtn").onclick = () => {

    window.open(
        `http://127.0.0.1:5000/cleandata/${cleanedFileName}`
    );

};


// navigation
document.getElementById("backBtn").onclick = () => {

     window.history.back();
};


document.getElementById("forecastBtn").onclick = () => {

    localStorage.setItem("forecastInput", JSON.stringify(cleanedData));

    window.location.href = "forecast.html";

};