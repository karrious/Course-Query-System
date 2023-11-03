import JSZip from "jszip";
import {InsightError} from "../IInsightFacade";
import {Section} from "../section";
import fs from "fs";

export async function extractContent(content: string){
	try {
		let promises: Array<Promise<string>> = [];
		let zip = new JSZip();
		zip = await JSZip.loadAsync(content, {base64: true});

		// for each to iterate through jszip object
		zip.forEach((relativePath, file) => {
			if (relativePath.startsWith("courses/")) {
				if (!relativePath.endsWith("/")){
					// call await promise.all on array to hold all those promises & push promise onto array
					// Access the contents of the file and add it to the result array
					const promiseFile = file.async("string");
					promises.push(promiseFile);
				}
			} else {
				throw new InsightError("Invalid content (folder not named courses or empty)");
			}
		});
		const courseFiles: string[] = await Promise.all(promises);
		// console.log(courseFiles);
		return courseFiles;
	} catch (error) {
		throw new InsightError("Invalid content");
	}
}

export function saveContent(id: string, contentUnzipped: string[]): Section[]{
	let allSections: Section[] = [];

	for (const str of contentUnzipped){
		try {
			const jsonData = JSON.parse(str);
			const sections: Section[] = jsonData.result.map((course: any) => {
				let yearValue = (course.Section && course.Section === "overall") ? 1900 : course.Year;

				return {
					title: course.Title,
					uuid: course.id,
					instructor: course.Professor,
					audit: course.Audit,
					year: Number(yearValue),
					id: course.Course,
					pass: course.Pass,
					fail: course.Fail,
					avg: course.Avg,
					dept: course.Subject
				};
			});
			allSections = allSections.concat(sections);
		} catch (error) {
			throw new InsightError("Invalid sections content");
		}
	}

	const serializedSections = JSON.stringify(allSections);
	// console.log(serializedSections);
	if (!fs.existsSync("./data")) {
		fs.mkdirSync("./data");
	}
	fs.writeFileSync("./data/" + id + ".json", serializedSections, "utf-8");

	return allSections;
}
