import * as fs from "fs";
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

import {extractContent, saveContent} from "./utilities/addSections";
import {processRoomsDataset} from "./utilities/addRooms";
import {QueryValidator} from "./utilities/QueryValidator";
import {PerformQuery} from "./utilities/PerformQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public datasets: Map<string, any[]>;
	public iDatasets: Map<string, InsightDataset>;

	constructor() {
		this.datasets = new Map();
		this.iDatasets = new Map();

		// crash handling
		// this.crash();
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
				const contentUnzipped = await extractContent(content);

				// save content
				this.datasets.set(id, saveContent(id, contentUnzipped));

			} else {
				const roomsContent = await processRoomsDataset(content, id);
				if (roomsContent) {
					this.datasets.set(id, roomsContent);
				} else {
					throw new InsightError("Invalid content");
				}
			}

			const dataArray = this.datasets.get(id);
			if (dataArray) {
				const newDataset: InsightDataset = {
					id: id,
					kind: kind,
					numRows: dataArray.length
				};
				this.iDatasets.set(newDataset.id, newDataset);
			} else {
				throw new InsightError("something weird happened if you see this message");
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

		for (let [key, dataset] of this.iDatasets) {
			datasetList.push(dataset);
		}
		console.log(datasetList);
		return Promise.resolve(datasetList);
	}
}
