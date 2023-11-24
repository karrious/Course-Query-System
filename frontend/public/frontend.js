// document.getElementById("click-me-button").addEventListener("click", handleClickMe);
//
// function handleClickMe() {
// 	alert("Button Clicked!");
// }

document.getElementById("searchBtn").addEventListener("click", searchCourses);

document.getElementById("instructorSearchBtn").addEventListener("click", searchInstructorPerformance);

function searchCourses() {
	const sectionAvg = parseFloat(document.getElementById("sectionAvg").value);
	const department = document.getElementById("department").value;
	const year = parseFloat(document.getElementById("year").value);

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
	executeQuery(query, "searchResults")

	// fetch('http://localhost:4321/query', {
	// 	method: 'POST',
	// 	headers: {
	// 		'Content-Type': 'application/json'
	// 	},
	// 	body: JSON.stringify(query)
	// })
	// 	.then(response => response.json())
	// 	.then(data => {
	// 		if (data.result && data.result.length > 0) {
	// 			displaySearchResults(data.result);
	// 		} else {
	// 			displayError('No courses found matching the criteria.');
	// 		}
	// 	})
	// 	.catch(error => {
	// 		console.error('Error:', error);
	// 		displayError('An error occurred while searching for courses.');
	// 	});
}

function searchInstructorPerformance() {
	let instructorName = document.getElementById("instructorName").value;
	let instructorYear = parseFloat(document.getElementById("instructorYear").value);

	const query = {
		WHERE: {
			AND: [
				{IS: {"sections_instructor": instructorName}},
				{EQ: {"sections_year": instructorYear}}
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
	executeQuery(query, "instructorResults")
}

function executeQuery(query, resultsID) {
	fetch('http://localhost:4321/query', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(query)
	})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			if (data.result && data.result.length > 0) {
				displaySearchResults(data.result, resultsID);
			} else {
				displayError('No courses found matching the criteria.', resultsID);
			}
		})
		.catch(error => {
			console.error('Error:', error);
			displayError('An error occurred while searching for courses.', resultsID);
		});
}

function displaySearchResults(results, resultsID) {
	const resultsDiv = document.getElementById(resultsID);
	let tableHTML = "<table><tr><th>Department</th><th>Course ID</th><th>Average</th><th>Instructor</th><th>Title</th></tr>";

	results.forEach(result => {
		tableHTML += `<tr>
            <td>${result.sections_dept}</td>
            <td>${result.sections_id}</td>
            <td>${result.sections_avg}</td>
            <td>${result.sections_instructor}</td>
            <td>${result.sections_title}</td>
        </tr>`;
	});

	tableHTML += "</table>";
	resultsDiv.innerHTML = tableHTML;
}

function displayError(message, resultsID) {
	const resultsDiv = document.getElementById(resultsID);
	resultsDiv.innerHTML = `<p class="error">${message}</p>`;
}

// document.getElementById("searchBtn").addEventListener("click", searchCourses);
