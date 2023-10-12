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


import {QueryValidator} from "./utilities/QueryValidator";
import {PerformQuery} from "./utilities/PerformQuery";

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
			// crash handling
			this.crash();

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

			// console.log([...this.datasets.values()]);
			// return id after dataset successfully added
			let datasetIds: string[] = Array.from(this.datasets.keys());
			return Promise.resolve(datasetIds);

		} catch (error) {
			console.log(error);
			return Promise.reject(error);
		}
	}

	// crash handling
	private crash() {
		if (fs.existsSync("./data")) {
			if (this.datasets.size < fs.readdirSync("./data").length) {
				// TODO: when crash happens, populate datasets from disk
			}
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
		if (this.datasets.has(id)) {
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

	private saveContent(id: string, contentUnzipped: string[]){
		let allSections: Section[] = [];

		for (const str of contentUnzipped){
			try {
				// console.log(str);
				// console.log("inside try");
				const jsonData = JSON.parse(str);
				// console.log("inside parse");
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
				allSections = allSections.concat(sections);
			} catch (error) {
				throw new InsightError("Invalid content");
			}
		}

		this.datasets.set(id, allSections);
		const serializedSections = JSON.stringify(allSections);
		// console.log(serializedSections);
		if (!fs.existsSync("./data")) {
			fs.mkdirSync("./data");
		}
		fs.writeFileSync("./data/" + id + ".json", serializedSections, "utf-8");
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
		return new Promise((resolve, reject) => {
			const queryValidator = new QueryValidator();
			try {
				const datasetID = queryValidator.queryValidator(query);
				if (!Object.keys(this.datasets).includes(datasetID)) {
					throw new InsightError("Reference dataset id not added yet.");
				}
				const datasetContent = this.datasets.get(datasetID);
				const performQueryHelper = new PerformQuery(datasetContent);
				const results = performQueryHelper.performQueryHelper(query);
				return Promise.resolve(results);
			} catch (error) {
				return Promise.reject(error);
			}
		});
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		let datasetList: InsightDataset[] = [];
		// let totalRows = 0;

		for (let [key, value] of this.datasets) {
			// totalRows += value.length;
			const dataset: InsightDataset = {
				id: key,
				kind: InsightDatasetKind.Sections,
				numRows: value.length
			};
			datasetList.push(dataset);
		}
		// this.datasets.forEach((value, key) => {
		// 	totalRows += value.length;
		// 	// console.log(totalRows);
		// 	// console.log(value.length);
		// 	const dataset: InsightDataset = {
		// 		id: key,
		// 		kind: InsightDatasetKind.Sections,
		// 		numRows: totalRows
		// 	};
		// 	datasetList.push(dataset);
		// });

		console.log(datasetList);
		return Promise.resolve(datasetList);
	}
}

