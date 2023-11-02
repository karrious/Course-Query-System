import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
	NotFoundError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";

use(chaiAsPromised);

describe("InsightFacade", function () {
	this.timeout(100000); // 100 seconds
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let sectionsL: string;
	let rooms: string;
	let rooms: string;

	before(function () {
		// This block runs once and loads the datasets.
		// sections = getContentFromArchives("pair.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		clearDisk();
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			// Using a smaller dataset to decrease run time
			sections = getContentFromArchives("pair1.zip");
			rooms = getContentFromArchives("campus.zip");
			rooms = getContentFromArchives("campus.zip");
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			facade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			clearDisk();
		});

		// This is a unit test. You should create more like this!
		it ("should reject with an empty dataset id", function() {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// addDataset tests
		it("addDatatset should reject with an space dataset id", function(){
			const result = facade.addDataset(" ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("addDatatset should reject dataset id with underscore", function(){
			const result = facade.addDataset("CP_SC", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should reject dataset if already in database", async function() {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it ("should successfully add a sections kind dataset", function() {
		it ("should successfully add a sections kind dataset", function() {
			sectionsL = getContentFromArchives("pair.zip");
			const result = facade.addDataset("ubc", sectionsL, InsightDatasetKind.Sections);
			return expect(result).to.eventually.deep.equal(["ubc"]);
		});
		// zoo++ is 2 empty + 1 non empty of 10
		// pairS is of 1500+ files, smaller version of pair
		// pairM is of 3500+ files

		it ("should successfully add a rooms kind dataset", function() {
			const result = facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.deep.equal(["ubc"]);
		});

		it("should successfully add multiple datasets of section kind", async function(){
		it ("should successfully add a rooms kind dataset", function() {
			const result = facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			return expect(result).to.eventually.deep.equal(["ubc"]);
		});

		it("should successfully add multiple datasets of section kind", async function(){
			await facade.addDataset("ubcv", sections, InsightDatasetKind.Sections);
			const result2 =  facade.addDataset("ubco", sections, InsightDatasetKind.Sections);
			return expect(result2).to.eventually.deep.equal(["ubcv", "ubco"]);
		});

		it("should successfully add multiple datasets of room kind", async function(){
			await facade.addDataset("ubcv", rooms, InsightDatasetKind.Rooms);
			const result2 =  facade.addDataset("ubco", rooms, InsightDatasetKind.Rooms);
			return expect(result2).to.eventually.deep.equal(["ubcv", "ubco"]);
		});

		it("should successfully add multiple datasets of different kind", async function(){
			await facade.addDataset("ubcv", sections, InsightDatasetKind.Sections);
			const result2 =  facade.addDataset("ubco", rooms, InsightDatasetKind.Rooms);
			return expect(result2).to.eventually.deep.equal(["ubcv", "ubco"]);
		});

		it("should reject if dataset is not a zip file",  function(){
			const result = facade.addDataset("ubc", "ubcubcubc", InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if datasete contains invalid course",  async function(){
			let iCourse: string;
			iCourse = await getContentFromArchives("pairCourseI.zip");
			const result = facade.addDataset("ubc", iCourse, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if dataset contains invalid section",  async function(){
			let sectionsI: string;
			sectionsI = await getContentFromArchives("pairInvalid section.zip");
			const result = facade.addDataset("ubc", sectionsI, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject if dataset contains invalid json inputes",  async function(){
			let sectionsIJ: string;
			sectionsIJ = await getContentFromArchives("pairInvalidJson.zip");
			const result = facade.addDataset("ubc", sectionsIJ, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should be able to handle crash",  async function(){
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			// pretend crash happened
			const newInstance = new InsightFacade();
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// removeDataset tests
		it("removeDataset should reject with an empty dataset id", function(){
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("removeDataset should reject id with underscore", function(){
			const result = facade.removeDataset("ub_c");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("removeDataset should reject nonexistent id",  function(){
			const result = facade.removeDataset("ubc");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("should remove newly added id", async function(){
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = facade.removeDataset("ubc");
			return expect(result).to.eventually.deep.equal("ubc");
		});

		it("remove the same dataset twice", async function(){
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			await facade.removeDataset("ubc");
			const result = facade.removeDataset("ubc");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		// listDatasets tests
		it("Can successfully list no dataset", function (){
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal([]);

		});

		it("Can successfully list one small added dataset", async function(){
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal([{
				id: "ubc",
				kind: InsightDatasetKind.Sections,
				numRows: 16}]);
		});

		it("Can successfully list a larger added dataset", async function(){
			sectionsL = getContentFromArchives("pair.zip");
			await facade.addDataset("ubc", sectionsL, InsightDatasetKind.Sections);
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal([{
				id: "ubc",
				kind: InsightDatasetKind.Sections,
				numRows: 64612}]);
		});

		it("Can successfully list room kind dataset", async function(){
			await facade.addDataset("ubc", rooms, InsightDatasetKind.Rooms);
			const result = facade.listDatasets();
			return expect(result).to.eventually.deep.equal([{
				id: "ubc",
				kind: InsightDatasetKind.Rooms,
				numRows: 364}]);
		});

		it("Can successfully list all added datasets", async function(){
			sectionsL = getContentFromArchives("pair.zip");
			await facade.addDataset("ubco", rooms, InsightDatasetKind.Rooms);
			await facade.addDataset("ubcv", sectionsL, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			expect(result).to.have.length(2);
			return expect(result).to.have.deep.members([
				{
					id: "ubco",
					kind: InsightDatasetKind.Rooms,
					numRows: 364,
				},
				{
					id: "ubcv",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			]);
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			facade = new InsightFacade();

			sections = getContentFromArchives("pair.zip");
			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			clearDisk();
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, InsightResult[], PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => facade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: (actual, expected) => {
					expect(actual).to.have.deep.members(expected);
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "InsightError") {
						expect(actual).to.be.an.instanceOf(InsightError);
					} else if (expected === "ResultTooLargeError"){
						expect(actual).to.be.an.instanceOf(ResultTooLargeError);
					} else {
						// this should be unreachable
						expect.fail("UNEXPECTED ERROR");
					}
				},
			}
		);
	});
});
