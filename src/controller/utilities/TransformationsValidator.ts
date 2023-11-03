import {InsightError} from "../IInsightFacade";

export class TransformationsValidator {
	private mfields: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	private sfields: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name",
		"address", "type", "furniture", "href"];

	public transformationsValidator(query: any) {
		let validcolumns: string[] = [];
		const keys = Object.keys(query);
		// Make sure both GROUP and APPLY exist in TRANSFORMATION.
		if (!keys.includes("GROUP") || !keys.includes("APPLY")) {
			throw new InsightError("Missing GROUP or APPLY or both");
		}

		// Make sure no key other than GROUP and APPLY exist in TRANSFORMATION.
		for (let key of keys) {
			if (key !== "GROUP" && key !== "APPLY") {
				throw new InsightError("Excess keys in TRANSFORMATION");
			}
		}
		validcolumns = validcolumns.concat(this.groupValidator(query["GROUP"]));
		validcolumns = validcolumns.concat(this.applyValidator(query["APPLY"]));
		return validcolumns;
	}

	private groupValidator(groups: any): string[] {
		if (groups === undefined) {
			throw new InsightError("Empty GROUP content.");
		}
		for (let group of groups) {
			if (typeof group !== "string") {
				throw new InsightError("Invalid type of GROUP key");
			}
			const parts = group.split("_");
			if (parts.length !== 2 || (!this.mfields.includes(parts[1]) && !this.sfields.includes(parts[1]))){
				throw new InsightError("Invalid GROUP field");
			}
		}
		return groups;
	}

	private applyValidator(apply: any){
		let applyKey: string[] = [];
		for (let index in apply as any) {
			let applyRule: any = apply[index];
			let applyRuleKey = Object.keys(applyRule)[0]; // overallAvg
			let applyContent = applyRule[applyRuleKey];
			let applyToken = Object.keys(applyContent)[0];
			let tokenContent = applyContent[applyToken];
			let key = tokenContent.split("_")[1];
			if (applyRuleKey === "" || applyToken === "") {
				throw new InsightError("No ApplyKey found");
			}
			if (applyToken === "MAX" || applyToken === "MIN" || applyToken === "AVG" || applyToken === "SUM") {
				if (!this.mfields.includes(key)) {
					throw new InsightError("Invalid apply key.");
				}
			} else if (applyToken === "COUNT") {
				if (!this.mfields.includes(key) && !this.sfields.includes(key)) {
					throw new InsightError("Invalid apply key.");
				}
			}
			applyKey = applyKey.concat(applyRuleKey);
		}
		return applyKey;
	}
}
