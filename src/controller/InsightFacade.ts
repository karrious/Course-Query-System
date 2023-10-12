import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError
} from "./IInsightFacade";

import {QueryValidator} from "./utilities/QueryValidator";
import {PerformQuery} from "./utilities/PerformQuery";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return Promise.reject("Not implemented.");
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		return new Promise((resolve, reject) => {
			const queryValidator = new QueryValidator();
			try {
				queryValidator.queryValidator(query);
				const performQueryHelper = new PerformQuery();
				const results = performQueryHelper.performQueryHelper(query, id);
				return Promise.resolve(results);
			} catch (error) {
				if (error instanceof InsightError){
					return Promise.reject(error);
				} else {
					return Promise.reject(new InsightError("Unexpected error."));
				}
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
