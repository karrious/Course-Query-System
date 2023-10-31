import JSZip from "jszip";
import * as parse5 from "parse5";
import {InsightError} from "../IInsightFacade";

export async function processRoomsDataset(content: string) {
	try {
		let promises: Array<Promise<string>> = [];
		let zip = new JSZip();
		zip = await JSZip.loadAsync(content, {base64: true});

		// check index.htm is valid
		const indexFile = await zip.file("index.htm")?.async("text");
		if (indexFile) {
			const indexDocument = parse5.parse(indexFile);

			// Recursively search the node tree for building list table
			const validTable = locateTable(indexDocument);
			if (validTable) {
				// TODO:  add rooms
				return ["edit THIS!"];
			} else {
				throw new Error("index.htm contains no table");
			}
		}

		return null;
	} catch (error) {
		throw new InsightError("Invalid rooms content");
	}
}

function locateTable(node: any): any[] | null {
	// invalid if index.htm contains no table
	if (!node) {
		return null;
	}
	// If current node is a table, check if it is the building list table
	if (node.tagName === "table") {
		if (isValidTable(node)) {
			return node;
		}
	}
	// If current node has children, search them recursively
	if (node.childNodes) {
		for (const child of node.childNodes) {
			const result = locateTable(child);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

// check if node is building list table
function isValidTable(node: any): boolean {
	let theadNode = null;
	for (const child of node.childNodes) {
		if (child.tagName === "thead") {
			theadNode = child;
			break;
		}
	}

	// iterate through each th in the thead to see if it is the building list table
	for (const trNode of theadNode.childNodes) {
		if (trNode.tagName === "tr") {
			for (const thNode of trNode.childNodes) {
				if (thNode.tagName === "th") {
					if (thNode.attrs && thNode.attrs.some((attr: {name: string, value: string}) =>
						attr.name === "class" &&
						attr.value === "views-field views-field-field-building-image")) {
						// only return true when spot the building list table column
						return true;
					}
				}
			}
		}
	}

	return false;
}
