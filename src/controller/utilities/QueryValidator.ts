import {InsightError} from "../IInsightFacade";

export class QueryValidator{

	public queryValidator(query: any): boolean{
		if(!this.whereValidator(query["WHERE"]) || !this.optionsValidator(query["OPTIONS"])){
			throw new InsightError("Wrong query structure.")
		}

	}

	private whereValidator(where: any): boolean{
		if (!where.hasOwnProperty('WHERE')) {
			throw new InsightError("Missing WHERE in the query body.");
		}
		let filterKey = Object.keys(where)[0];
		if (filterKey === "AND" || filterKey === "OR"){
			return this.logicComparisonValidator(filterKey);
		} else if (filterKey === "LT" || filterKey === "GT" || filterKey === "EQ"){
			return this.mComparisonValidator(filterKey);
		} else if (filterKey === "IS"){
			return this.sComparisonValidator(filterKey);
		} else if (filterKey === "NOT"){
			return this.negationValidator(filterKey);
		} else {
			throw new InsightError("Wrong filter key.");
		}
	}

	private logicComparisonValidator(logicComparison: any): boolean{
		if (!Array.isArray(logicComparison) || logicComparison.length === 0){
			throw new InsightError("Wrong logic.")
		}
		logicComparison.forEach((lComparison: any) => this.whereValidator(lComparison));
	}

	private mComparisonValidator(mComparison: any): boolean{
		const mKey = Object.keys(mComparison)[0];
		if (typeof mComparison(mKey) !== "number"){
			throw new InsightError("Wrong value in mComparison.")
		}
		return true;
	}

	private sComparisonValidator(sComparison: any): boolean{
		const sKey = Object.keys(sComparison)[0];
		if (typeof sComparison(sKey) !== "string"){
			throw new InsightError("Wrong value in sComparison.")
		}
		return true;
	}

	private negationValidator(negation: any): boolean{
		if (typeof negation.NOT !== "object" || Object.keys(negation).length !== 1){
			throw new InsightError("Wrong negation.");
		}
		return this.whereValidator(negation);
	}

	private validateOptions(options: any): void {
        if (!options || !options.COLUMNS || options.COLUMNS.length === 0) {
            throw new InsightError("Wrong options.");
        }
        try{
        	const validColumns: string[] = this.validateColumns(options.COLUMNS);
        	if (options.ORDER) {
				this.validateOrder(options.ORDER, validColumns);
			}
        } catch (error){
        	throw new InsightError("Wrong columns or order.");
        }
    }

	private columnsValidator(columns: any): string[] {
		if (!Array.isArray(columns) || columns.length === 0) {
			throw new InsightError("Wrong columns clause.");
		}
		for (let column of columns) {
			if (typeof column !== "string") {
				throw new InsightError("Invalid in columns");
			}
		}
		return columns;
	}

	private validateOrder(order: any, validColumns: string[]): void {
		if (typeof order !== "string" || !validColumns.includes(order)) {
			throw new InsightError("Wrong order or order not included in columns");
		}
	}
}
