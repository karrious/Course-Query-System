import {InsightResult} from "./IInsightFacade";

export class PerformQuery{
	public insightResult: InsightResult[] = [];

	public performQuery(query: any): InsightResult[]{
		let filterKey = Object.keys(query["WHERE"])[0];
		if (filterKey === "AND" || filterKey === "OR"){
			this.insightResult = this.logicComparison(query["WHERE"][filterKey]);
		} else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ"){
			this.insightResult = this.mComparison(query["WHERE"][filterKey]);
		} else if (filterKey === "IS"){
			this.insightResult = this.sComparison(query["WHERE"][filterKey]);
		} else if (filterKey === "NOT"){
			this.insightResult = this.negation(query["WHERE"][filterKey]);
		}

		const columns = query["OPTIONS"]["COLUMNS"];
		const order = query["OPTIONS"]["ORDER"];
		let optionsResult = this.insightResult.map(result => {
			let columnResult: InsightResult = {};
			for (let column of columns){
				columnResult[column] = result[column];
			}
		})
		this.insightResult = this.orderQuery(optionsResult, order);
		return this.insightResult;
	}

	private logicComparison(logic: any): InsightResult[]{
		return logicDataset;
	}

	private mComparison(m: any): InsightResult[]{
		const mKey: string = Object.keys(m)[0];
		const
	}

	private sComparison(s: any): InsightResult[]{
		const sKey: string = Object.keys(s)[0];
		const value: string = s[sKey];
		return this.sDataset.filter((section) => {
			const sectionValue: string = section[sKey];

			if (value.startsWith('*') && value.endsWith('*')) {
				return sectionValue.includes(value.substring(1, value.length - 1));
			} else if (value.startsWith('*')) {
				return sectionValue.endsWith(value.substring(1));
			} else if (value.endsWith('*')) {
				return sectionValue.startsWith(value.substring(0, value.length - 1));
			} else {
				return sectionValue === value;
			}
		})
	}

	private negation(negation: any): InsightResult[]{
		return negationDataset;
	}

	private orderQuery(orderDataset: InsightResult[], order: any): InsightResult[]{
		return orderDataset;
	}
}
