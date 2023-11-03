import {InsightError} from "../IInsightFacade";

export class OptionsValidator {
	private mfields: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
	private sfields: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name",
		"address", "type", "furniture", "href"];

	public optionsValidator(options: any, validColumns: string[]): string{
		const keys = Object.keys(options);
		// make sure COLUMNS exist
		if (!keys.includes("COLUMNS")) {
			throw new InsightError("OPTIONS missing COLUMNS");
		}

		// make sure nothing weird is in the mix of COLUMNS and ORDER.
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
		this.columnsValidator(options["COLUMNS"], validColumns);
		// ORDER is optional, it can exist or not exist
		if (options["ORDER"]){
			this.validateOrder(options["ORDER"], validColumns);
		}
		return id;
	}

	private getIdFromOptions(options: any): string {
		const columns = options["COLUMNS"];
		const firstColumn = columns[0];
		if (typeof firstColumn === "string" && firstColumn.includes("_")) {
			return firstColumn.split("_")[0];  // Split the string and get the id
		}
		throw new InsightError("Invalid dataset id");
	}

	private columnsValidator(columns: any[], validcolumns: string[]) {
		for (let column of columns) {
			if (typeof column !== "string") {
				throw new InsightError("Invalid type of COLUMN key");
			}
			if (!validcolumns.includes(column)) {
				throw new InsightError("Column not present in anykey");
			}
		}
	}

	private validateOrder(order: any, validColumns: string[]) {
		if (typeof order === "string") {
			if (!validColumns.includes(order)) {
				throw new InsightError("Wrong order or order not included in columns");
			}
		} else if ((order["dir"] !== "UP" && order["dir"] !== "DOWN") || order["keys"] === undefined) {
			throw new InsightError("Missing or wrong dir or keys in ORDER");
		} else {
			let orderKeys = order["keys"];
			for (let orderKey of orderKeys) {
				if (!validColumns.includes(orderKey)) {
					throw new InsightError("Key in order not present in anykey");
				}
			}
		}
	}
}
