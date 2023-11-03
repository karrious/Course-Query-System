import {InsightResult} from "../IInsightFacade";
import Decimal from "decimal.js";

export class PerformTransformations {
	private mfields: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	private sfields: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name",
		"address", "type", "furniture", "href"];

	public performTransformations(datasetContent: InsightResult[], query: any): InsightResult[] {
		if (!query) {
			return datasetContent;
		}
		const groupKeys = query["GROUP"];
		const applyRules = query["APPLY"];
		let groupResults: InsightResult[][] = this.performGroup(groupKeys, datasetContent);
		let applyResults: InsightResult[] = this.performApply(applyRules, groupResults);
		return applyResults;
	}


	private performGroup(groupKeys: string[], datasetContent: InsightResult[]): InsightResult[][] {
		let groupResults: InsightResult[][] = [];
		let groupMap: {[key: string]: InsightResult[]} = {};
		for (let item of datasetContent) {
			let computedKey = groupKeys.map((key) => {
				let key2 = key.split("_")[1];
				return item[key2];
			}).join("|");
			if (!groupMap[computedKey]) {
				groupMap[computedKey] = [];
			}
			groupMap[computedKey].push(item);
		}
		groupResults = Object.values(groupMap);
		return groupResults;
	}

	private performApply(applyRules: string[], groupResults: InsightResult[][]): InsightResult[] {
		let applyResults: InsightResult[] = [];
		for (let index in groupResults) {
			let groupResult: InsightResult[] = groupResults[index];
			const result: InsightResult = {};
			for (let index1 in applyRules) {
				let applyRule: any = applyRules[index1];
				let applyRuleKey = Object.keys(applyRule)[0]; // overallAvg
				let applyContent = applyRule[applyRuleKey]; // "AVG": "sections_avg"
				let applyToken = Object.keys(applyContent)[0]; // "AVG"
				let tokenContent = applyContent[applyToken]; // "section_avg"
				let key = tokenContent.split("_")[1];
				switch(applyToken) {
					case "MAX":
						groupResult[0][applyRuleKey] = this.applyMax(groupResult, key);
						break;
					case "MIN":
						groupResult[0][applyRuleKey] = this.applyMin(groupResult, key);
						break;
					case "AVG":
						groupResult[0][applyRuleKey] = this.applyAvg(groupResult, key);
						break;
					case "SUM":
						groupResult[0][applyRuleKey] = this.applySum(groupResult, key);
						break;
					case "COUNT":
						groupResult[0][applyRuleKey] = this.applyCount(groupResult, key);
						break;
				}
			}
			applyResults.push(groupResult[0]);
		}
		return applyResults;
	}

	private applyMax(groupResult: InsightResult[], tokenContent: string){
		let max = groupResult[0][tokenContent];
		for (let num in groupResult) {
			if (groupResult[num][tokenContent] > max) {
				max = groupResult[num][tokenContent];
			}
		}
		return max;
	}

	private applyMin(groupResult: InsightResult[], tokenContent: string){
		let min = groupResult[0][tokenContent];
		for (let num in groupResult) {
			if (groupResult[num][tokenContent] < min) {
				min = groupResult[num][tokenContent];
			}
		}
		return min;
	}

	private applyAvg(groupResult: InsightResult[], tokenContent: string){
		let total = new Decimal(0);
		for (let num in groupResult) {
			total = total.add(new Decimal(groupResult[num][tokenContent]));
		}
		let average = total.toNumber() / groupResult.length;
		return Number(average.toFixed(2));
	}

	private applySum(groupResult: InsightResult[], tokenContent: string){
		let total = new Decimal(0);
		for (let num in groupResult) {
			total = total.add(new Decimal(groupResult[num][tokenContent]));
		}
		return Number(total.toFixed(2));
	}

	private applyCount(groupResult: InsightResult[], tokenContent: string){
		let count = new Set();
		for (let num in groupResult) {
			count.add(groupResult[num][tokenContent]);
		}
		return count.size;
	}
}
