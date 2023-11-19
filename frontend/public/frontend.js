// document.getElementById("click-me-button").addEventListener("click", handleClickMe);
//
// function handleClickMe() {
// 	alert("Button Clicked!");
// }

document.getElementById("searchBtn").addEventListener("click", function() {
	let sectionAvg = document.getElementById("sectionAvg").value;
	let department = document.getElementById("department").value;
	let year = document.getElementById("year").value;
	// Add logic to perform the search and update the searchResults div
});

document.getElementById("instructorSearchBtn").addEventListener("click", function() {
	let instructorName = document.getElementById("instructorName").value;
	let instructorYear = document.getElementById("instructorYear").value;
	// Add logic to perform the search and update the instructorResults div
});

// Add functions to perform AJAX requests to your backend and render the results as tables
