import {InsightError, InsightResult, ResultTooLargeError} from "../IInsightFacade";

export class PerformQuery{
	public insightResult: InsightResult[] = [];

	public performQueryHelper(query: any, datasetContent: any[]): InsightResult[]{
		this.insightResult = datasetContent;
		let filterKey = Object.keys(query["WHERE"])[0];
		if (filterKey === "AND" || filterKey === "OR"){
			this.insightResult = this.logicComparison(query["WHERE"][filterKey], datasetContent);
		} else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ"){
			this.insightResult = this.mComparison(query["WHERE"][filterKey], datasetContent);
		} else if (filterKey === "IS"){
			this.insightResult = this.sComparison(query["WHERE"][filterKey], datasetContent);
		} else if (filterKey === "NOT"){
			this.insightResult = this.negation(query["WHERE"][filterKey], datasetContent);
		}

		if (this.insightResult.length > 5000) {
			throw new ResultTooLargeError("The result is too large.");
		}

		const columns = query["OPTIONS"]["COLUMNS"];
		const order = query["OPTIONS"]["ORDER"];
		let optionsResult = this.insightResult.map((result) => {
			let columnResult: InsightResult = {};
			for (let column of columns){
				columnResult[column] = result[column];
			}
			return columnResult;
		});
		this.insightResult = this.orderQuery(optionsResult, order);
		return this.insightResult;
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
					if (conditionKey === "AND" || conditionKey === "OR") {
						results = results.filter((result) =>
							this.logicComparison(condition, datasetContent).includes(result));
					} else if (conditionKey === "LT" || conditionKey === "GT" || conditionKey === "EQ") {
						results = results.filter((result) =>
							this.mComparison(condition, datasetContent).includes(result));
					} else if (conditionKey === "IS") {
						results = results.filter((result) =>
							this.sComparison(condition, datasetContent).includes(result));
					} else if (conditionKey === "NOT") {
						results = results.filter((result) =>
							!this.negation(condition, datasetContent).includes(result));
					}
				}return results;
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
				}return combinedResults;
			}
			default: throw new InsightError("Invalid logic operator.");
		}
	}

	private mComparison(m: any, datasetContent: any[]): InsightResult[]{
		const comparator: string = Object.keys(m)[0];
		const key: string = Object.keys(m[comparator])[0];
		const value: number = m[comparator][key];

		switch (comparator) {
			case "GT":
				return this.insightResult.filter((section) => section[key] > value);
			case "LT":
				return this.insightResult.filter((section) => section[key] < value);
			case "EQ":
				return this.insightResult.filter((section) => section[key] === value);
			default:
				throw new InsightError("Invalid M COMPARATOR");
		}
	}

	private sComparison(s: any, datasetContent: any[]): InsightResult[]{
		const sKey: string = Object.keys(s)[0];
		const value: string = s[sKey];
		return datasetContent.filter((section: any) => {
			const sectionValue: string = section[sKey] as string;

			if (value.startsWith("*") && value.endsWith("*")) {
				return sectionValue.includes(value.substring(1, value.length - 1));
			} else if (value.startsWith("*")) {
				return sectionValue.endsWith(value.substring(1));
			} else if (value.endsWith("*")) {
				return sectionValue.startsWith(value.substring(0, value.length - 1));
			} else {
				return sectionValue === value;
			}
		});
	}

	private negation(negation: any, datasetContent: any[]): InsightResult[]{
		let negationResults: InsightResult[] = [];
		const negationKey = Object.keys(negation)[0];
		if (negationKey === "AND" || negationKey === "OR"){
			negationResults = this.logicComparison(negation[negationKey], datasetContent);
		} else if (negationKey === "LT" || negationKey === "GT" || negationKey === "EQ"){
			negationResults = this.mComparison(negation[negationKey], datasetContent);
		} else if (negationKey === "IS"){
			negationResults = this.sComparison(negation[negationKey], datasetContent);
		} else if (negationKey === "NOT"){
			negationResults = this.negation(negation[negationKey], datasetContent);
		}
		return datasetContent.filter((result) => {
			return !negationResults.includes(result);
		});
	}

	private orderQuery(orderDataset: InsightResult[], order: any): InsightResult[]{
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
