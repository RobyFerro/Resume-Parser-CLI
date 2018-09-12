const path = require('path');
const textract = require('textract');
const cmd = require('node-cmd');
const fs = require('fs');
const rm = require('rimraf');
const ImgParser = require('./img-parser');

class ParseUtils {
	
	constructor(file) {
		this.file = file;
		this.hash = Date.now().toString();
		this.tmpDir = `../tmp/${this.hash}`;
		this.pdfExportDir = '../results/converted';
		this.faceExportDir = '../results/faces';
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
			
			await textract.fromFileWithPath(main.file, function(error, text) {
				main.result.text = text;
				resolve();
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
				
				if(!program.pdf) {
					console.log(`WARNING: --converted-dir option require -p parameter`);
					process.exit(1);
				} // if
				
				main.pdfExportDir = program.convertedDir;
			} // if
			
			if(program.faceDir) {
				
				if(!program.images) {
					console.log(`WARNING: --face-dir option require -i parameter`);
					process.exit(1);
				} // if
				
				main.faceExportDir = program.faceDir;
			} // if
			
			resolve(true);
			
		});
		
	}
	
}

module.exports = ParseUtils;

