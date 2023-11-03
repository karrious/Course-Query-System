import JSZip from "jszip";
import * as parse5 from "parse5";
import {InsightError} from "../IInsightFacade";
import {Room} from "../room";
import fs from "fs";
import http from "http";

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export async function processRoomsDataset(content: string, id: string) {
	try {
		let buildingList: Map<string, any[]>;
		let roomsList: any[] = [];
		let zip = new JSZip();
		zip = await JSZip.loadAsync(content, {base64: true});

		// check index.htm is valid
		const indexFile = await zip.file("index.htm")?.async("text");
		if (indexFile) {
			const indexDocument = parse5.parse(indexFile);
			// recursively search the node tree for building list table
			const validTbody = locateTable(indexDocument, "views-field views-field-field-building-image");
			if (validTbody) {
                // after finding a valid table, save to buildingList
				buildingList = await getBuildings(validTbody);
			} else {
				throw new InsightError("building list table not found");
			}
		} else {
			throw new InsightError("index.htm not valid");
		}

		const buildingFiles: string[] = await getBuildingFiles(zip, buildingList);
		const buildingEntries = Array.from(buildingList.entries());
		for (const [i, buildingDocument] of buildingFiles.entries()) {
			const buildingFile = parse5.parse(buildingDocument);
			const validRTbody = locateTable(buildingFile,"views-field views-field-field-room-number");
			if (validRTbody) {
				roomsList = roomsList.concat(getRooms(validRTbody, buildingEntries[i]));
			}
		}

		const serializedRooms = JSON.stringify(roomsList);
		// save rooms to disk
		if (!fs.existsSync("./data")) {
			fs.mkdirSync("./data");
		}
		fs.writeFileSync("./data/" + id + ".json", serializedRooms, "utf-8");
		return roomsList;
	} catch (error) {
		throw new InsightError("Invalid rooms content");
	}
}

function locateTable(node: any, className: string): any | null {
	// invalid if index.htm contains no table
	if (!node) {
		return null;
	}
	// If current node is a table, check if it is the building list table
	if (node.tagName === "tbody") {
		if (isValidTable(node, className)) {
			return node;
		}
	}
	// If current node has children, search them recursively
	if (node.childNodes) {
		for (const child of node.childNodes) {
			const result = locateTable(child, className);
			if (result) {
				return result;
			}
		}
	}
	return null;
}

// check if node is building list table
function isValidTable(node: any, className: string): boolean {
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
				attr.value === className)) {
				return true;
			}
		}
	}

	return false;
}

async function getBuildings(tbody: any){
	let buildings: Map<string, any[]> = new Map();
	let buildingPromises: Array<Promise<void>> = [];
	for (let tr of tbody.childNodes) {
		if (tr.nodeName === "tr" && tr.childNodes) {
			const code = getColumnData(tr, "views-field views-field-field-building-code");
			const name = getColumnData(tr, "views-field views-field-title");
			const address = getColumnData(tr, "views-field views-field-field-building-address");
			const link = getColumnData(tr, "views-field views-field-nothing");

			buildingPromises.push(processBuilding(code, name, address, link, buildings));
		}
	}
	await Promise.all(buildingPromises);
	return buildings;
}

async function processBuilding(
	code: string, name: string, address: string, link: string, buildings: Map<string, any[]>) {
	try {
		const geoResponse = await getGeolocation(address, "170");
		if (geoResponse.error) {
			console.error(geoResponse.error);
		} else if (geoResponse.lat && geoResponse.lon) {
			buildings.set(code, [name, address, link, geoResponse.lat, geoResponse.lon]);
		}
	} catch (error) {
		return Promise.reject(error);
	}
}

function getColumnData(tr: any, className: string) {
	for (let td of tr.childNodes) {
		if (td.nodeName === "td" && td.attrs[0].name === "class" && td.attrs[0].value.includes(className)) {
			if (className === "views-field views-field-title" ||
				className === "views-field views-field-field-room-number") {
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
		// get the file according to the link, so if you can find the file, for sure it was included in index.htm
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

function getRooms(tbody: any, building: [string, any[]]) {
	let rooms: Room[] = [];
	for (let tr of tbody.childNodes) {
		if (tr.nodeName === "tr" && tr.childNodes) {
			const number = getColumnData(tr, "views-field views-field-field-room-number");
			const seats = getColumnData(tr, "views-field views-field-field-room-capacity");
			const furniture = getColumnData(tr, "views-field views-field-field-room-furniture");
			const type = getColumnData(tr, "views-field views-field-field-room-type");
			const href = getColumnData(tr, "views-field views-field-nothing");

			const room: Room = {
				fullname: building[1][0],
				shortname: building[0],
				number: number,
				name: building[0] + "_" + number,
				address: building[1][1],
				lat: building[1][3],
				lon: building[1][4],
				seats: Number(seats),
				type: type,
				furniture: furniture,
				href: href
			};
			rooms.push(room);
		}
	}
	return rooms;
}

function getGeolocation(address: string, teamNumber: string): Promise<GeoResponse> {
	return new Promise((resolve, reject) => {
		const encodedAddress = encodeURIComponent(address);
		const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team${teamNumber}/${encodedAddress}`;

		http.get(url, (response) => {
			let data = "";

			response.on("data", (chunk) => {
				data += chunk;
			});

			response.on("end", () => {
				if (response.statusCode !== 200) {
					reject(new Error("Failed to fetch geolocation data"));
					return;
				}

				try {
					const json: GeoResponse = JSON.parse(data);
					resolve(json);
				} catch (e) {
					reject(new Error("Failed to parse geolocation data"));
				}
			});

		}).on("error", (err) => {
			reject(err);
		});
	});
}
