const path = require('path');
const textract = require('textract');
const cmd = require('node-cmd');
const fs = require('fs');
const rm = require('rimraf');
const ImgParser = require('./img-parser');

class ParseUtils {
	
	constructor(file, dirname) {
		this.file = file;
		this.dirname = dirname;
		this.hash = Date.now().toString();
		this.tmpDir = `${dirname}/tmp/${this.hash}`;
		this.pdfExportDir = '';
		this.faceExportDir = '';
		this.fileInfo = path.parse(this.file);
		this.result = {
			text: null,
			face: null,
			pdf: null
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
		
		return new Promise(async function(resolve) {
			
			await main.updateExportDirectory(program);
			
			if(program.pdf) {
				
				if(!program.convertedDir) {
					console.log('Command -p require to specify an output directory. Please set this option through --converted-dir command');
					process.exit(1);
				} // if
				
				await main.getPdf();
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
				
				if(!program.faceDir) {
					console.log('Command -i require to specify an output directory. Please set this option through --face-dir command');
					process.exit(1);
				} // if
				
				await main.findFaces();
			} // if
			
			if(program.json) {
				JSON.stringify(main.result);
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
			
			await main.setConvertedDocumentAsMainFile();
			
			await textract.fromFileWithPath(main.file, async function(error, text) {
				
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
			
			resolve({
				email: mail !== null ? mail[0] : null,
				phone: phone !== null ? phone[0] : null,
				name: name !== null ? name[0] : null,
				birthday: birthday !== null ? birthday[0] : null,
				raw: text
			});
			
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
			
			await ImgParser.checkFaceInPics(path, main.file, main.faceExportDir, main.hash)
				.then(async result => {
					if(!result.result) {
						ImgParser.guessFaceByAspectRatio(path, main.faceExportDir, main.hash)
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
				await cmd.run(`/etc/bashrc; export HOME=/tmp/; /usr/bin/oowriter --convert-to pdf ${main.file} --outdir ${main.pdfExportDir} --headless`);
				main.result.pdf = `${main.pdfExportDir}/${main.fileInfo.name}.pdf`;
			} else {
				await fs.createReadStream(`${main.file}`)
					.pipe(fs.createWriteStream(`${main.pdfExportDir}/${main.fileInfo.base}`));
				main.result.pdf = `${main.pdfExportDir}/${main.fileInfo.base}`;
			} // if
			
			resolve(true);
		});
		
		
	}
	
	/**
	 *
	 * @param program
	 * @returns {Promise<boolean>}
	 */
	updateExportDirectory(program) {
		
		let main = this;
		
		return new Promise(resolve => {
			
			if(program.convertedDir) {
				main.pdfExportDir = program.convertedDir;
			} // if
			
			if(program.faceDir) {
				main.faceExportDir = program.faceDir;
			} // if
			
			resolve(true);
			
		});
		
	}
	
}

module.exports = ParseUtils;

