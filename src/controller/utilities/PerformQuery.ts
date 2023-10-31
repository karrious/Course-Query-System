import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";

export class PerformQuery{
	public insightResult: InsightResult[] = [];

	public performQueryHelper(query: any, datasetContent: any[], id: string): InsightResult[]{
		try {
			this.insightResult = datasetContent;
			let filterKey = Object.keys(query["WHERE"])[0];
			if (filterKey === "AND" || filterKey === "OR"){
				this.insightResult = this.logicComparison(query["WHERE"], datasetContent);
			} else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ"){
				this.insightResult = this.mComparison(query["WHERE"], datasetContent);
			} else if (filterKey === "IS"){
				this.insightResult = this.sComparison(query["WHERE"][filterKey], datasetContent);
			} else if (filterKey === "NOT"){
				this.insightResult = this.negation(query["WHERE"][filterKey], datasetContent);
			}

			if (this.insightResult.length > 5000) {
				throw new ResultTooLargeError("The result is too large.");
			}

			const columnsOriginal = query["OPTIONS"]["COLUMNS"];
			const order = query["OPTIONS"]["ORDER"];
			let columns: string[] = [];
			for (const col of columnsOriginal) {
				columns.push(this.splitField(col));
			}
			let optionsResult = this.insightResult.map((result) => {
				let columnResult: InsightResult = {};
				for (let column of columns){
					if (column === "year") {
						columnResult[id + "_" + column] = Number(result[column]);
					} else if (column === "uuid") {
						columnResult[id + "_" + column] = String(result[column]);
					} else {
						columnResult[id + "_" + column] = result[column];
					}
				}
				return columnResult;
			});

			const keys = Object.keys(query["OPTIONS"]);
			if (keys.includes("ORDER")) {
				this.insightResult = this.orderQuery(optionsResult, order);
			} else {
				this.insightResult = optionsResult;
			}
			return this.insightResult;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	private splitField (column: string): string {
		let parts = column.split("_");
		return parts.slice(1).join("_");
	}

	private logicComparison(logic: any, datasetContent: any[]): InsightResult[]{
		const logicOperator: string = Object.keys(logic)[0];
		const conditions = logic[logicOperator];
		if (conditions.length === 0){
			throw new InsightError("No conditions provided for logic operator.");
		}
		let results: InsightResult[] = datasetContent;
		switch (logicOperator){
			case "AND":
				for (let condition of conditions) {
					const conditionKey = Object.keys(condition)[0];
					let tempResults: InsightResult[] = [];
					if (conditionKey === "AND" || conditionKey === "OR") {
						tempResults = this.logicComparison(condition, datasetContent);
					} else if (conditionKey === "LT" || conditionKey === "GT" || conditionKey === "EQ") {
						tempResults = this.mComparison(condition, datasetContent);
					} else if (conditionKey === "IS") {
						tempResults = this.sComparison(condition, datasetContent);
					} else if (conditionKey === "NOT") {
						tempResults = this.negation(condition, datasetContent);
					}

					// Intersect results with tempResults
					results = results.filter((result) => tempResults.includes(result));
				}
				return results;
			case "OR": {
				let combinedResults: InsightResult[] = [];
				for (let condition of conditions) {
					const conditionKey = Object.keys(condition)[0];
					let tempResults: InsightResult[] = [];
					if (conditionKey === "AND" || conditionKey === "OR") {
						tempResults = this.logicComparison(condition, datasetContent);
					} else if (conditionKey === "LT" || conditionKey === "GT" || conditionKey === "EQ") {
						tempResults = this.mComparison(condition, datasetContent);
					} else if (conditionKey === "IS") {
						tempResults = this.sComparison(condition, datasetContent);
					} else if (conditionKey === "NOT") {
						tempResults = this.negation(condition, datasetContent);
					}
					for (let result of tempResults) {
						if (!combinedResults.some((combinedResult) =>
							JSON.stringify(combinedResult) === JSON.stringify(result))) {
							combinedResults.push(result);
						}
					}
				} return combinedResults;
			}
			default: throw new InsightError("Invalid logic operator.");
		}
	}

	private mComparison(m: any, datasetContent: any[]): InsightResult[]{
		const comparator: string = Object.keys(m)[0];
		const keyOriginal: string = Object.keys(m[comparator])[0]; // "id_field"
		const key: string = keyOriginal.split("_")[1]; // "field"
		const value: number = m[comparator][keyOriginal];
		let results: InsightResult[] = datasetContent;
		if (key === "year" && m[comparator][keyOriginal] === "overall") {
			m[comparator][keyOriginal] = 1900;
		}

		switch (comparator) {
			case "GT":
				results = results.filter((section) => section[key] > value);
				break;
			case "LT":
				results = results.filter((section) => section[key] < value);
				break;
			case "EQ":
				results = results.filter((section) => section[key] === value);
				break;
			default:
				throw new InsightError("Invalid M COMPARATOR");
		}
		return results;
	}

	private sComparison(s: any, datasetContent: any[]): InsightResult[]{
		const comparator: string = Object.keys(s)[0]; // "comparator"
		const sKeyOriginal: string = Object.keys(s[comparator])[0]; // "id_field"
		const sKey: string = sKeyOriginal.split("_")[1]; // "field"
		let value: string = s[comparator][sKeyOriginal]; // "value in field"
		let results: InsightResult[] = datasetContent;
		// console.log(comparator);
		// console.log(sKeyOriginal);
		// console.log(sKey);
		// console.log(value);

		if (typeof value === "object" && value !== null) {
			value = value[Object.keys(value)[0]];
		}
		if (value.indexOf("*") === 0 && value.endsWith("*")) {
			value = value.substring(1, value.length - 1);
			// console.log(comparator);
			// console.log(sKeyOriginal);
			// console.log(sKey);
			// console.log(value);
			results = results.filter((section) => String(section[sKey]).includes(value));
		} else if (value.indexOf("*") === 0) {
			value = value.substring(1);
			results = results.filter((section) => String(section[sKey]).endsWith(value));
		} else if (value.endsWith("*")) {
			value = value.substring(0, value.length - 1);
			results = results.filter((section) => String(section[sKey]).startsWith(value));

		} else {
			results = results.filter((section) => section[sKey] === value);
		}

		return results;
	}

	private negation(negation: any, datasetContent: any[]): InsightResult[]{
		let negationResults: InsightResult[] = [];
		const negationKey = Object.keys(negation)[0];

		if (negationKey === "AND" || negationKey === "OR"){
			negationResults = this.logicComparison(negation, datasetContent);
		} else if (negationKey === "LT" || negationKey === "GT" || negationKey === "EQ"){
			negationResults = this.mComparison(negation, datasetContent);
		} else if (negationKey === "IS"){
			negationResults = this.sComparison(negation[negationKey], datasetContent);
		} else if (negationKey === "NOT"){
			negationResults = this.negation(negation[negationKey], datasetContent);
		}

		// I cannot think of a case where this is not valid TODO: please verify
		let results: InsightResult[] = datasetContent;
		const negationUUIDs = new Set(negationResults.map((result) => result.uuid));
		results = results.filter((section) => !negationUUIDs.has(section.uuid));
		return results;
	}

	private orderQuery(orderDataset: InsightResult[], order: string): InsightResult[]{
		if (!order || order.length === 0) {
			return orderDataset;
		}
		return orderDataset.sort((a: any, b: any) => {
			let aValue = a[order];
			let bValue = b[order];
			if (typeof aValue === "number" && typeof bValue === "number") {
				return (aValue - bValue);
			} else if (typeof aValue === "string" && typeof bValue === "string") {
				return aValue.localeCompare(bValue);
			}
			throw new InsightError("Wrong type for order key.");
		});
	}
}

