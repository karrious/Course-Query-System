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
	}
}
