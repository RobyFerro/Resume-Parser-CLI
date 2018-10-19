const path = require('path');
const textract = require('textract');
const fs = require('fs');
const rm = require('rimraf');
const ImgParser = require('./img-parser');
const jsonFile = require('jsonfile');
const execSync = require('child_process').execSync;

class ParseUtils {
	
	/**
	 *
	 * @param file
	 * @returns {Promise<string>}
	 */
	static createTmpFile(file) {
		
		return new Promise(async resolve => {
			
			let tmpFile = file.replace(/ /g, "_");
			fs.copyFileSync(file, tmpFile);
			
			resolve(tmpFile);
		});
		
	}
	
	/**
	 * @param file
	 */
	static deleteTmpFile(file) {
		fs.unlinkSync(file);
	}
	
	constructor(file, dirname) {
		this.file = file;
		this.dirname = dirname;
		this.hash = Date.now().toString();
		this.tmpDir = `${dirname}/tmp/${this.hash}`;
		this.exportDir = '';
		this.fileInfo = path.parse(this.file);
		this.result = {
			text: null,
			face: null,
			pdf: null,
			json: null
		};
	}
	
	/**
	 * Parse selected document
	 * @param program
	 * @returns {Promise<boolean>}
	 */
	parse(program) {
		
		let main = this;
		main.createTempDir();
		
		if(!program.exportDir) {
			console.log('Command --export-dir is required!');
			process.exit(1);
		} else {
			main.exportDir = program.exportDir;
		} // if
		
		return new Promise(async function(resolve) {
			
			if(program.pdf) {
				await main.getPdf().then(async function() {
					await main.setConvertedDocumentAsMainFile();
				});
			} // if
			
			if(program.text) {
				await main.getText();
			} // if
			
			if(program.images) {
				
				if(main.fileInfo.ext !== '.pdf') {
					
					if(!program.pdf) {
						
						console.log(
							`Command -i needs a pdf file. To convert document in pdf please add -p command`
						);
						
						process.exit(1);
					} // if
					
					if(!program.pdf) {
						await main.getPdf();
					} // if
					
				} // if
				
				await main.findFaces();
			} // if
			
			if(program.json) {
				
				main.result.json = `${main.exportDir}/${main.fileInfo.name}.json`;
				
				jsonFile.writeFileSync(main.result.json, main.result, error => {
					if(error) throw error;
				});
				
			} // if
			
			main.deleteTempDir().then(() => {
				resolve(true);
			});
			
		});
		
	}
	
	/**
	 * Create TMP directory for this instance
	 */
	createTempDir() {
		
		if(!fs.existsSync(`${this.dirname}/tmp`)) {
			fs.mkdirSync(`${this.dirname}/tmp`);
		} // if
		
		fs.mkdirSync(this.tmpDir);
	}
	
	/**
	 * Delete instance TMP directory
	 * @returns {Promise<boolean>}
	 */
	deleteTempDir() {
		
		return new Promise(resolve => {
			
			rm(this.tmpDir, () => {
				resolve(true);
			});
			
		});
		
	}
	
	/**
	 * Set converted file as main file in this instance
	 * @returns {Promise<boolean>}
	 */
	setConvertedDocumentAsMainFile() {
		
		let main = this;
		
		return new Promise(resolve => {
			if(main.fileInfo.ext !== '.pdf' && main.result.pdf !== null) {
				main.file = main.result.pdf;
			} // if
			
			resolve(true);
		});
	}
	
	/**
	 * Get file text
	 */
	getText() {
		
		let main = this;
		
		return new Promise(async function(resolve) {
			
			textract.fromFileWithPath(main.file, async function(error, text) {
				
				if(error) throw error;
				
				main.result.text = await main.findDataInText(text);
				resolve();
			});
			
		});
		
	}
	
	/**
	 * Check for information inside a given text
	 * @param text
	 * @returns {Promise<object>}
	 */
	findDataInText(text) {
		
		return new Promise(resolve => {
			
			let mail = text.match(/([a-z0-9_.-]+)@([\da-z.-]+)\.([a-z.]{2,6})/),
				phone = text.match(/(?:(?:\+?([1-9]|[0-9][0-9]|[0-9][0-9][0-9])\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([0-9][1-9]|[0-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/),
				name = text.match(/[A-Z][a-z]+\s[A-Z][a-z]+/),
				birthday = text.match(/(0?[0-9]|1[0-9]|2[0-9]|3[0-1])\/(0?[0-9]|1[0-2])\/((\d{2}?\d{2})|\d{2})/);
			
			let data = {
				email: mail !== null ? mail[0] : null,
				phone: phone !== null ? phone[0] : null,
				person: {
					fullName: name !== null ? name[0] : null,
					name: null,
					surname: null
				},
				birthday: birthday !== null ? birthday[0] : null,
				raw: text
			};
			
			if(data.person.fullName !== null) {
				let split = data.person.fullName.split(' ');
				
				data.person.name = split[0];
				data.person.surname = split[1];
			} // if
			
			resolve(data);
			
		});
	}
	
	/**
	 * Find faces inside document and save it in result folder
	 */
	findFaces() {
		
		const path = `${this.tmpDir}/`;
		let main = this;
		
		return new Promise(async resolve => {
			
			await main.setConvertedDocumentAsMainFile();
			
			await ImgParser.checkFaceInPics(path, main.file, main.exportDir, main.hash)
				.then(async result => {
					if(!result.result) {
						ImgParser.guessFaceByAspectRatio(path, main.exportDir, main.hash)
							.then(result => {
								
								if(result.result) {
									main.result.face = result.key;
								} // if
								
							});
					} else {
						main.result.face = result.key;
					} // if
				});
			
			resolve();
			
		});
	}
	
	/**
	 * Convert document to PDF and save it in result folder
	 * @returns {Promise<boolean>}
	 */
	getPdf() {
		
		let main = this;
		
		return new Promise(async function(resolve) {
			
			if(main.fileInfo.ext !== '.pdf') {
				execSync(`/etc/bashrc; export HOME=/tmp/; /usr/bin/oowriter --convert-to pdf ${main.file} --outdir ${main.exportDir} --headless`);
			} else {
				
				let export_file = `${main.exportDir}/${main.fileInfo.base}`;
				
				// Check if file exists
				if(fs.existsSync(export_file)) {
					export_file = `${main.exportDir}/${main.fileInfo.name}(1).${main.fileInfo.ext}`;
				} // if
				
				await fs.createReadStream(`${main.file}`)
					.pipe(fs.createWriteStream(`${export_file}`));
				
			} // if
			
			main.result.pdf = `${main.exportDir}/${main.fileInfo.name}.pdf`;
			
			resolve(true);
		});
		
		
	}
	
}

module.exports = ParseUtils;

