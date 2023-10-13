import {InsightError} from "../IInsightFacade";

export class QueryValidator{
	private mfields: string[] = ["avg", "pass", "fail", "audit", "year"];
	private sfields: string[] = ["dept", "id", "instructor", "title", "uuid"];

	public queryValidator(query: any) {
		try {
			const keys = Object.keys(query);

			// make sure both WHERE and OPTIONS exist
			if (!keys.includes("WHERE") || !keys.includes("OPTIONS")) {
				// console.log(keys);
				// console.log(!keys.includes("WHERE") || !keys.includes("OPTIONS"));
				throw new InsightError("Missing WHERE or OPTIONS or both");
			}

			// make sure nothing weird is in the mix
			for (let key of keys) {
				if (key !== "WHERE" && key !== "OPTIONS") {
					throw new InsightError("Excess keys in query");
				}
			}

			const id = this.optionsValidator(query["OPTIONS"]);
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

		// make sure key is equal to "id_field" and value is a number
		if (this.fieldValidator(mKey, id, this.mfields) && typeof mComparison[mKey] !== "number"){
			throw new InsightError("Invalid value in mComparison.");
		}
		return true;
	}

	private sComparisonValidator(sComparison: any, id: string): boolean{
		const sKey = Object.keys(sComparison)[0];
		const value = sComparison[sKey];

		// make sure key is equal to "id_field" and value is a string
		if (this.fieldValidator(sKey, id, this.sfields) && typeof value !== "string"){
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
		if (typeof negation !== "object" || Object.keys(negation).length !== 1){
			throw new InsightError("Wrong negation.");
		}
		return this.whereValidator(negation, id);
	}

	private optionsValidator(options: any): string {
		try{
			const keys = Object.keys(options);
			// make sure COLUMNS exist
			if (!keys.includes("COLUMNS")) {
				throw new InsightError("OPTIONS missing COLUMNS");
			}

			// make sure nothing weird is in the mix of COLUMNS and ORDER
			for (let key of keys) {
				if (key !== "COLUMNS" && key !== "ORDER") {
					throw new InsightError("Invalid keys in OPTIONS");
				}
			}

			// make sure COLUMNS is an array and has at least one value
			if (!Array.isArray(options.COLUMNS) || options.COLUMNS.length === 0) {
				throw new InsightError("COLUMNS must be a non-empty array");
			}

			const id = this.getIdFromOptions(options);
			const validColumns: string[] = this.columnsValidator(options.COLUMNS, id);
			// ORDER is optional, it can exist or not exist
			if (options.ORDER){
				if (typeof options.ORDER !== "string") {
					throw new InsightError("Invalid ORDER type");
				}
				this.validateOrder(options.ORDER, validColumns, id);
			}

			return id;
		} catch (error){
			throw new InsightError("Incorrect format of OPTIONS");
		}
	}

	private getIdFromOptions(options: any): string {
		const columns = options.COLUMNS;
		const firstColumn = columns[0];
		if (typeof firstColumn === "string" && firstColumn.includes("_")) {
			return firstColumn.split("_")[0];  // Split the string and get the id
		}
		throw new InsightError("Invalid dataset id");
	}

	private columnsValidator(columns: any[], id: string): string[] {
		for (let column of columns) {
			if (typeof column !== "string") {
				throw new InsightError("Invalid type of COLUMN key");
			}
			if(!this.fieldValidator(column, id, this.mfields) && !this.fieldValidator(column, id, this.sfields)) {
				throw new InsightError("Invalid COLUMNS field");
			}
		}
		return columns;
	}

	// pass in "id_field", id, and type of field
	// check if "id_field" is valid
	private fieldValidator(field: string, id: string, fields: string[]): boolean {
		const parts = field.split("_");
		if (parts.length !== 2 || parts[0] !== id) {
			return false;
		}
		return fields.includes(parts[1]);
	}

	private validateOrder(order: string, validColumns: string[], id: string) {
		if (typeof order !== "string" || !validColumns.includes(order)) {
			throw new InsightError("Wrong order or order not included in columns");
		}
	}
}
