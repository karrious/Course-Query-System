import JSZip from "jszip";
import * as parse5 from "parse5";
import {InsightError} from "../IInsightFacade";

export async function processRoomsDataset(content: string) {
	try {
		let buildingList: Map<string, any[]>;
		let zip = new JSZip();
		zip = await JSZip.loadAsync(content, {base64: true});

		// check index.htm is valid
		const indexFile = await zip.file("index.htm")?.async("text");
		if (indexFile) {
			const indexDocument = parse5.parse(indexFile);
			// recursively search the node tree for building list table
			const validTbody = locateTable(indexDocument);
			if (validTbody) {
                // after finding a valid table, save to buildingList
				buildingList = getBuildings(validTbody);
			} else {
				throw new InsightError("building list table not found");
			}
		} else {
			throw new InsightError("index.htm not valid");
		}

		const buildingFiles: string[] = await getBuildingFiles(zip, buildingList);

		return null;
	} catch (error) {
		throw new InsightError("Invalid rooms content");
	}
}

function locateTable(node: any): any | null {
	// invalid if index.htm contains no table
	if (!node) {
		return null;
	}
	// If current node is a table, check if it is the building list table
	if (node.tagName === "tbody") {
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
	let trNode = null;
	for (const tr of node.childNodes) {
		if (tr.tagName === "tr") {
			trNode = tr;
			break;
		}
	}

	// iterate through each th in the thead to see if it is the building list table
	for (const tdNode of trNode.childNodes) {
		if (tdNode.tagName === "td") {
			if (tdNode.attrs && tdNode.attrs.some((attr: {name: string, value: string}) =>
				attr.name === "class" &&
				attr.value === "views-field views-field-field-building-image")) {
				return true;
			}
		}
	}

	return false;
}

function getBuildings(tbody: any){
	let buildings: Map<string, any[]> = new Map();
	for (let tr of tbody.childNodes) {
		if (tr.nodeName === "tr" && tr.childNodes) {
			const code = getColumnData(tr, "views-field views-field-field-building-code");
			const name = getColumnData(tr, "views-field views-field-title");
			const address = getColumnData(tr, "views-field views-field-field-building-address");
			const link = getColumnData(tr, "views-field views-field-nothing");
			buildings.set(code, [name, address, link]);
		}
	}
	return buildings;
}

function getColumnData(tr: any, className: string) {
	for (let td of tr.childNodes) {
		if (td.nodeName === "td" && td.attrs[0].name === "class" && td.attrs[0].value.includes(className)) {
			if (className === "views-field views-field-title") {
				return td.childNodes[1].childNodes[0].value.trim();
			} else if (className === "views-field views-field-nothing") {
				return td.childNodes[1].attrs[0].value.trim();
			} else {
				return td.childNodes[0].value.trim();
			}
		}
	}
}

async function getBuildingFiles(zip: JSZip, buildingList: Map<string, any[]>) {
	let promises: Array<Promise<string>> = [];
	// iterate to get promises of all buildings
	for (let [code, info] of buildingList) {
		let link = info[2];
		let buildingFilename = link.split("./").pop();
		const buildingFile = zip.file(buildingFilename);
		if (buildingFile) {
			promises.push(buildingFile.async("text"));
		} else {
			throw new InsightError("Building from building list table in index is missing in buildings-and-classrooms");
		}
	}
	const buildingFiles: string[] = await Promise.all(promises);
	return buildingFiles;
}
