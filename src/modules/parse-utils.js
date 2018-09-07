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
		this.result = {
			text: null,
			face: null,
			pdf: null
		};
		this.promise = [];
	}
	
	parse(program) {
		
		this.createTempDir();
		
		if(program.text) {
			this.promise['text'] = this.getText();
		} // if
		
		if(program.images) {
			this.promise['faces'] = this.findFaces();
		} // if
		
		if(program.pdf) {
			if(this.getExtension() !== '.pdf') {
				this.promise['pdf'] = this.getPdf();
			} // if
		} // if
		
		if(program.json) {
			this.promise['json'] = JSON.stringify(this.result);
		} // if
		
	}
	
	/**
	 * Create TMP directory for this instance
	 */
	createTempDir() {
		fs.mkdirSync(this.tmpDir);
	}
	
	/**
	 * Delete instance TMP directory
	 */
	deleteTempDir() {
		rm(this.tmpDir, () => {
			console.log('Temp folder deleted...');
		});
	}
	
	/**
	 * Get file extension
	 * @returns {string}
	 */
	getExtension() {
		return path.extname(this.file);
	}
	
	/**
	 * Get file text
	 */
	getText() {
		
		let main = this;
		
		return new Promise(function(resolve) {
			
			textract.fromFileWithPath(main.file, function(error, text) {
				main.result.text = text;
			});
			
			resolve();
		});
		
	}
	
	/**
	 * Find faces inside document and save it in result folder
	 */
	findFaces() {
		
		const path = `${this.tmpDir}/`;
		let main = this;
		
		return new Promise(function(resolve) {
			
			cmd.get(`pdfimages -png ${main.file} ${main.tmpDir}/img`, function(err) {
				
				if(!err) {
					
					fs.readdirSync(path).forEach(file => {
						
						// Ricerco volto tramite face utils
						let face = new ImgParser(file, main.tmpDir, main.hash);
						
						face.detectFaceInPic().then(function(result) {
							
							if(!result) {
								
								ImgParser.guessFaceByAspectRatio(path, main.tmpDir, main.hash).then(function(result) {
									if(result) {
										main.result.face = `${main.hash}/${result.key}`;
									} // if
								});
								
							} // if
							
						});
						
					});
					
					
				} else {
					console.log(err);
				} // if
				
				resolve();
				
			});
			
			resolve();
			
		});
	}
	
	/**
	 * Convert document to PDF and save it in result folder
	 */
	getPdf() {
		cmd.run(`/etc/bashrc; export HOME=/tmp/; /usr/bin/oowriter --convert-to pdf ${this.file} --outdir ${this.pdfExportDir} --headless`);
		this.result.pdf = `${this.file}`;
	}
	
	makeJsonFile() {
		console.log(JSON.stringify(this.result));
	}
	
}

module.exports = ParseUtils;

