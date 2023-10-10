import * as fs from "fs";
import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";
import {Section} from "./section";


/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public datasets: Map<string, any[]>;

	constructor() {
		this.datasets = new Map();
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			// Make sure id is valid
			this.validateDatasetId(id);

			// Make sure kind is valid
			this.validateKind(kind);

			// Check if the dataset with the same id already exists
			this.checkDuplicateId(id);

			// Extract and validate content
			const contentUnzipped = await this.extractContent(content);

			// Parse content
			this.saveContent(id, contentUnzipped);

			// return id after dataset successfully added
			return Promise.resolve([id]);

		} catch (error) {
			console.log(error);
			return Promise.reject(error);
		}
	}

	// Make sure id is valid
	private validateDatasetId(id: string) {
		if (id === "" || id.includes("_") || id === " ") {
			throw new InsightError("Invalid dataset id");
		}
	}

	// Make sure kind is valid
	private validateKind(kind: InsightDatasetKind) {
		if (kind !== InsightDatasetKind.Sections) {
			throw new InsightError("Invalid dataset kind");
		}
	}

	// Check if the dataset with the same id already exists
	private checkDuplicateId(id: string) {
		if (fs.existsSync("./data/" + id + ".json")) {
			throw new InsightError("Dataset id already exist");
		}
	}

	private async extractContent(content: string){
		try {
			let promises: Array<Promise<string>> = [];
			let zip = new JSZip();
			zip = await JSZip.loadAsync(content, {base64: true});

			// for each to iterate through jszip object
			zip.forEach((relativePath, file) => {
				if (relativePath.startsWith("courses/")) {
					// call await promise.all on array to hold all those promises & push promise onto array
					// Access the contents of the file and add it to the result array
					const promiseFile = file.async("string");
					promises.push(promiseFile);
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

	private saveContent(id: string, contentUnzipped: string[]){
		for (const str of contentUnzipped){
			try {
				const jsonData = JSON.parse(str);
				console.log("inside parse");
				// console.log(jsonData);
				const sections: Section[] = jsonData.result.map((course: any) => ({
					title: course.Title,
					uuid: course.id,
					instructor: course.Professor,
					audit: course.Audit,
					year: course.Year,
					id: course.Course,
					pass: course.Pass,
					fail: course.Fail,
					avg: course.Avg,
					dept: course.Subject
				}));

				console.log("mapped sections");
				const serializedSections = JSON.stringify(sections);
				console.log("stringified");
				if (!fs.existsSync("./data")) {
					fs.mkdirSync("./data");
					console.log("directory created");
				}
				fs.writeFileSync("./data/" + id + ".json", serializedSections, "utf-8");
			} catch (error) {
				throw new InsightError("Invalid content");
			}
		}
	}

	public removeDataset(id: string): Promise<string> {
		try {
			// Make sure id is valid
			this.validateDatasetId(id);

			// Make sure id exist
			this.idExist(id);

			// Remove dataset
			this.datasets.delete(id);
			fs.unlinkSync("./data/" + id + ".json");

			return Promise.resolve(id);
		} catch (error) {
			console.log(error);
			return Promise.reject(error);
		}
	}

	private idExist(id: string) {
		if (!fs.existsSync("./data/" + id + ".json")) {
			throw new NotFoundError("Dataset id does not exist");
		}
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}

