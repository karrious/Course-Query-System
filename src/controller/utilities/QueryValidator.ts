import {InsightError} from "../IInsightFacade";
import {TransformationsValidator} from "./TransformationsValidator";
import {OptionsValidator} from "./OptionsValidator";

export class QueryValidator{
	private mfields: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	private sfields: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number","name",
		"address", "type", "furniture", "href"];

	public queryValidator(query: any) {
		try {
			const keys = Object.keys(query);
			const transformationsValidator = new TransformationsValidator();
			const optionsValidator = new OptionsValidator();

			// make sure both WHERE and OPTIONS exist
			if (!keys.includes("WHERE") || !keys.includes("OPTIONS")) {
				// console.log(keys);
				// console.log(!keys.includes("WHERE") || !keys.includes("OPTIONS"));
				throw new InsightError("Missing WHERE or OPTIONS or both");
			}

			// make sure nothing weird is in the mix
			for (let key of keys) {
				if (key !== "WHERE" && key !== "OPTIONS" && key !== "TRANSFORMATIONS") {
					throw new InsightError("Excess keys in query");
				}
			}
			// Todo: optionsValidator pass in validColumns and check in columns, actually write new options.
			const validColumns: string[] = transformationsValidator.transformationsValidator(query["TRANSFORMATIONS"]);
			const id = optionsValidator.optionsValidator(query["OPTIONS"], validColumns);
			this.whereValidator(query["WHERE"], id);
			return id;
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	private whereValidator(where: any, id: string): boolean{
		// true if WHERE is empty, we just probably have over 5k results
		if (Object.keys(where).length === 0) {
			return true;
		}

		const filters = Object.keys(where);
		// false if there are more than one filter key not nested
		if (filters.length > 1) {
			throw new InsightError("WHERE should only have 1 key, has " + filters.length);
		}

		let filterKey = Object.keys(where)[0];
		if (filterKey === "AND" || filterKey === "OR"){
			return this.logicComparisonValidator(where[filterKey], id);
		} else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ"){
			return this.mComparisonValidator(where[filterKey], id);
		} else if (filterKey === "IS"){
			return this.sComparisonValidator(where[filterKey], id);
		} else if (filterKey === "NOT"){
			return this.negationValidator(where[filterKey], id);
		} else {
			throw new InsightError("Invalid filter key: " + filterKey);
		}
	}

	private logicComparisonValidator(logicComparison: any[], id: string): boolean {
		if (!Array.isArray(logicComparison) || logicComparison.length === 0){
			throw new InsightError("Wrong logic.");
		}

		for (let condition of logicComparison) {
			if (!this.whereValidator(condition, id)) {
				throw new InsightError("Invalid direct comparison");
			}
		}
		return true;
	}

	private mComparisonValidator(mComparison: any, id: string): boolean{
		const mKey = Object.keys(mComparison)[0];

		if (Object.keys(mComparison).length > 1) {
			throw new InsightError("Invalid argument in comparator");
		}

		// make sure key is equal to "id_field" and value is a number
		if (!this.fieldValidator(mKey, id, this.mfields) || typeof mComparison[mKey] !== "number"){
			throw new InsightError("Invalid value in mComparison.");
		}
		return true;
	}

	private sComparisonValidator(sComparison: any, id: string): boolean{
		const sKey = Object.keys(sComparison)[0];
		const value = sComparison[sKey];

		if (Object.keys(sComparison).length > 1) {
			throw new InsightError("Invalid argument in comparator");
		}

		// make sure key is equal to "id_field" and value is a string
		if (!this.fieldValidator(sKey, id, this.sfields) || typeof value !== "string"){
			throw new InsightError("Invalid value in sComparison.");
		}

		// Validate wildcard asterisks
		if (!this.validWildcardString(value)) {
			throw new InsightError("Invalid wildcard string in IS filter: " + value);
		}

		return true;
	}

	private validWildcardString(value: string): boolean {
		// Validate that if asterisks are used, and are only at the beginning and/or end, max: 1
		if (value.startsWith("*")) {
			value = value.substring(1);
		}
		if (value.endsWith("*")) {
			value = value.substring(0, value.length - 1);
		}

		// Check if there's still an asterisk in the string
		if (value.includes("*")) {
			return false;
		}

		return true;
	}

	private negationValidator(negation: any, id: string): boolean{
		if (Object.keys(negation).length > 1) {
			throw new InsightError("Invalid argument in comparator");
		}

		if (typeof negation !== "object" || Object.keys(negation).length !== 1){
			throw new InsightError("Wrong negation.");
		}
		return this.whereValidator(negation, id);
	}

	private fieldValidator(field: string, id: string, fields: string[]): boolean {
		const parts = field.split("_");
		if (parts.length !== 2 || parts[0] !== id || !fields.includes(parts[1])) {
			return false;
		}
		return fields.includes(parts[1]);
	}
}
