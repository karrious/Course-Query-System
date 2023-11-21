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

function searchCourses() {
	const sectionAvg = document.getElementById("sectionAvg").value;
	const department = document.getElementById("department").value;
	const year = document.getElementById("year").value;

	const query = {
		WHERE: {
			AND: [
				{ GT: { "sections_avg": sectionAvg } },
				{ IS: { "sections_dept": department } },
				{ EQ: { "sections_year": year } }
			]
		},
		OPTIONS: {
			COLUMNS: [
				"sections_dept",
				"sections_avg",
				"sections_id",
				"sections_instructor",
				"sections_title",
				"sections_uuid",
				"sections_pass",
				"sections_fail",
				"sections_year",
				"sections_audit"
			]
		}
	};

	fetch('http://localhost:4321/query', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(query)
	})
		.then(response => response.json())
		.then(data => {
			if (data.result && data.result.length > 0) {
				displaySearchResults(data.result);
			} else {
				displayError('No courses found matching the criteria.');
			}
		})
		.catch(error => {
			console.error('Error:', error);
			displayError('An error occurred while searching for courses.');
		});
}

function displaySearchResults(results) {
	const resultsDiv = document.getElementById("searchResults");
	let tableHTML = "<table><tr><th>Department</th><th>Course ID</th><th>Average</th><th>Instructor</th><th>Title</th></tr>";

	results.forEach(result => {
		tableHTML += `<tr>
            <td>${result.courses_dept}</td>
            <td>${result.courses_id}</td>
            <td>${result.courses_avg}</td>
            <td>${result.courses_instructor}</td>
            <td>${result.courses_title}</td>
        </tr>`;
	});

	tableHTML += "</table>";
	resultsDiv.innerHTML = tableHTML;
}

function displayError(message) {
	const resultsDiv = document.getElementById("searchResults");
	resultsDiv.innerHTML = `<p class="error">${message}</p>`;
}

document.getElementById("searchBtn").addEventListener("click", searchCourses);
