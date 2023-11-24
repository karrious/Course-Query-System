import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {expect} from "chai";
import request, {Response} from "supertest";
import * as fs from "fs-extra";

describe("Facade D3", function () {
	this.timeout(100000);
	let facade: InsightFacade;
	let server: Server;
	let sections: string;
	const SERVER_URL = "http://localhost:4321";

	before(function () {
		facade = new InsightFacade();
		server = new Server(4321);
		sections = getContentFromArchives("pair.zip");
		return server.start();
	});

	after(async function () {
		await clearDisk();
		return server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
		// console.log("before each reached");
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
		// console.log("after each reached");
	});

	// Sample on how to format PUT requests
	it("PUT test for sections dataset", function () {
		const ENDPOINT_URL = "/dataset/sections/sections";
		const ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/pair.zip");
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					console.log("PUT request successful ", res.status);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("PUT request failed", err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	it("PUT test for rooms dataset", function () {
		const ENDPOINT_URL = "/dataset/ubcr/rooms";
		const ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/campus.zip");
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					console.log("PUT request successful ", res.status);
				})
				.catch(function (err) {
					// some logging here please!
					console.error("PUT request failed", err.message);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});

	// DELETE test for courses dataset
	it("DELETE test 404", function () {
		const ENDPOINT_URL = "/dataset/ubc";
		return request(SERVER_URL)
			.delete(ENDPOINT_URL)
			.then(function (res: Response) {
				// Logging success
				expect(res.status).to.be.equal(404);
				console.log("DELETE not found error");
			})
			.catch(function (err) {
				expect.fail();
			});
	});

	it("DELETE test for courses dataset", async function () {
		await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
		const ENDPOINT_URL = "/dataset/ubc";
		return request(SERVER_URL)
			.delete(ENDPOINT_URL)
			.then(function (res: Response) {
				// Logging success
				expect(res.status).to.be.equal(200);
				console.log("DELETE request successful");
			})
			.catch(function (err) {
				// Logging error
				console.error("DELETE request failed", err.message);
				expect.fail();
			});
	});

	// POST test for query on dataset
	it("POST test for query on dataset to return properly", function () {
		const ENDPOINT_URL = "/query";
		// const QUERY_DATA = fs.readFileSync("test/resources/archives/queryExampleTest.json");
		const QUERY_DATA = JSON.parse(fs.readFileSync("test/resources/archives/queryExampleTest.json", "utf8"));
		console.log(QUERY_DATA);
		return request(SERVER_URL)
			.post(ENDPOINT_URL)
			.send(QUERY_DATA)
			.set("Content-Type", "text/json")
			.then(function (res: Response) {
				// Logging success
				console.log(res.status);
				expect(res.status).to.be.equal(200);
				console.log("POST request successful");
			})
			.catch(function (err) {
				// Logging error
				console.error("POST request failed", err.message);
				expect.fail();
			});
	});

	it("POST test for query on dataset to fail", function () {
		const ENDPOINT_URL = "/query"; // adjust as necessary
		const INVALID_QUERY_DATA = {
			WHERE: {
				IS: [
					{
						sections_instructor: 123
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"sections_dept",
					"sections_pass",
					"sections_instructor"
				]
			}
		};
		return request(SERVER_URL)
			.post(ENDPOINT_URL)
			.send(INVALID_QUERY_DATA)
			.expect(400) // Expecting a 400 error for the invalid query
			.then(function (res: Response) {
				expect(res.body).to.have.property("error");
				// Additional assertions can be made here
			})
			.catch(function (err) {
				expect.fail(`Should not fail for invalid query: ${err}`);
			});
	});

	// GET test to list all datasets
	it("GET test to list all datasets", function () {
		const ENDPOINT_URL = "/datasets"; // adjust as necessary
		return request(SERVER_URL)
			.get(ENDPOINT_URL)
			.then(function (res: Response) {
				// Logging success
				expect(res.status).to.be.equal(200);
				console.log("GET request successful");
			})
			.catch(function (err) {
				// Logging error
				console.error("GET request failed", err.message);
				expect.fail();
			});
	});
});
