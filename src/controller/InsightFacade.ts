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

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// private insightDatasetList: InsightDataset[];
	constructor() {
		// this.insightDatasetList =
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Make sure id is valid
		this.validateDatasetId(id);

		// Make sure kind is valid
		this.validateKind(kind);

		// Check if the dataset with the same id already exists
		this.checkDuplicateId(id);

		// Extract and validate content
		const contentZip = this.extractContent(content);

		return Promise.reject("Not implemented.");
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

	private async extractContent(content: string): string[] {
		try {
			let zip = new JSZip();
			zip = await JSZip.loadAsync(content, {base64: true});
			let promises: Array<Promise<string>>;

			// if (zip.name !== "courses/") {
			// 	throw new InsightError("Invalid content");
			// }

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
			return promises;
		} catch (error) {
			throw new InsightError("Invalid content");
		}
	}

	// TODO!!!
	// parse the data to json
	// save the parsed data as array of objects

	// Check if the dataset with the same id already exists
	private checkDuplicateId(id: string) {
		// TODO!!!
	}


	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}

