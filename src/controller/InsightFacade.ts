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
import * as parse5 from "parse5";


import {QueryValidator} from "./utilities/QueryValidator";
import {PerformQuery} from "./utilities/PerformQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public datasets: Map<string, any[]>;
	public datasetRooms: Map<string, any[]>;
	public iDatasets: Map<string, InsightDataset>;

	constructor() {
		this.datasets = new Map();
		this.datasetRooms = new Map();
		this.iDatasets = new Map();

		// crash handling
		this.crash();
	}

	// crash handling
	private crash() {
		if (fs.existsSync("./data")) {
			const disk: string[] = fs.readdirSync("./data");

			// if datasets is missing courses compared to disk
			if (this.datasets.size < disk.length) {
				for (const file of disk) {
					const datasetId = file.replace(".json", "");

					if (!this.datasets.has(datasetId)) {
						const fileContent = fs.readFileSync("./data/" + datasetId + ".json", "utf-8");
						const datasetContent = JSON.parse(fileContent);
						this.datasets.set(datasetId, datasetContent);
						this.datasets.set(datasetId, datasetContent);
						// TODO: when crash happens, populate datasets from disk
					}
				}
			}
		}
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		try {
			// Make sure id is valid
			this.validateDatasetId(id);

			// Check if the dataset with the same id already exists
			this.checkDuplicateId(id);

			if (kind === InsightDatasetKind.Sections) {
				// Extract and validate content
				const contentUnzipped = await this.extractContent(content);

				// Parse content
				this.saveContent(id, contentUnzipped);
			} else {
				const contentUnzipped = await this.processRoomsDataset(content);
			}

			// return id after dataset successfully added
			let datasetIds: string[] = Array.from(this.datasets.keys());
			return Promise.resolve(datasetIds);

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
				throw new InsightError("Invalid sections content");
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

	private async processRoomsDataset(content: string) {
		try {
			let promises: Array<Promise<string>> = [];
			let zip = new JSZip();
			zip = await JSZip.loadAsync(content, {base64: true});

			// check index.htm is valid
			const indexFile = await zip.file("index.htm")?.async("text");
			if (indexFile) {
				const indexDocument = parse5.parse(indexFile);

				// Recursively search the node tree for building list table
				const validTable = this.locateTable(indexDocument);
				if (validTable) {
					// TODO:  add rooms
				} else {
					throw new Error("index.htm contains no table");
				}
			}
		} catch (error) {
			throw new InsightError("Invalid rooms content");
		}
	}

	private locateTable(node: any): any[] | null {
		// invalid if index.htm contains no table
		if (!node) {
			return null;
		}
		// If current node is a table, check if it is the building list table
		if (node.tagName === "table") {
			if (this.isValidTable(node)) {
				return node;
			}
		}
		// If current node has children, search them recursively
		if (node.childNodes) {
			for (const child of node.childNodes) {
				const result = this.locateTable(child);
				if (result) {
					return result;
				}
			}
		}
		return null;
	}

	// check if node is building list table
	private isValidTable(node: any): boolean {
		let theadNode = null;
		for (const child of node.childNodes) {
			if (child.tagName === "thead") {
				theadNode = child;
				break;
			}
		}

		// iterate through each th in the thead to see if it is the building list table
		for (const trNode of theadNode.childNodes) {
			if (trNode.tagName === "tr") {
				for (const thNode of trNode.childNodes) {
					if (thNode.tagName === "th") {
						if (thNode.attrs && thNode.attrs.some((attr: {name: string, value: string}) =>
							attr.name === "class" &&
							attr.value === "views-field views-field-field-building-image")) {
							// only return true when spot the building list table column
							return true;
						}
					}
				}
			}
		}

		return false;
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
		try {
			const queryValidator = new QueryValidator();
			const datasetID = queryValidator.queryValidator(query);
			if (!this.datasets.has(datasetID)) {
				throw new InsightError("Reference dataset id not added yet.");
			}
			const datasetContent = this.datasets.get(datasetID);
			if (!datasetContent) {
				throw new InsightError("Dataset content not found for the given id.");
			}
			const performQueryHelper = new PerformQuery();
			const results = performQueryHelper.performQueryHelper(query, datasetContent, datasetID);
			return Promise.resolve(results);
		} catch (error) {
			return Promise.reject(error);
		}
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
		console.log(datasetList);
		return Promise.resolve(datasetList);
	}
}
