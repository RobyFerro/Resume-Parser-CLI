const fr = require('face-recognition');
const fs = require('fs');
const cmd = require('node-cmd');

class ImgParser {
	
	/**
	 * @param file
	 * @param tmpDir
	 * @param hash
	 */
	constructor(file, tmpDir, hash) {
		/*this.file = file;*/
	}
	
	/**
	 * @param path
	 * @param file
	 * @returns {Promise<boolean>}
	 */
	static extractImagesFromPDF(path, file) {
		
		return new Promise(async resolve => {
			await cmd.get(`pdfimages -png ${file} ${path}/img`, err => {
				resolve(true);
			});
			
		});
		
	}
	
	/**
	 * Detect faces through a list of pics.
	 * This method will be use a face-recognition library
	 */
	static checkFaceInPics(path, file, outputDir, hash) {
		
		return new Promise(async resolve => {
			
			let faces = [];
			
			this.extractImagesFromPDF(path, file).then(async response => {
				
				let content = fs.readdirSync(path);
				
				for(let i in content) {
					let activePic = content[i];
					
					let img = fr.loadImage(`${path}${activePic}`),
						detector = fr.FaceDetector();
					
					if(img.cols >= 20) {
						
						let face = await detector.detectFaces(img);
						
						if(face.length !== 0) {
							
							faces.push(`${outputDir}/${hash}-${activePic}`);
							
							//console.log('Face found with primary algorithm! Coping in faces folder...');
							
							await fs.createReadStream(`${path}${activePic}`)
								.pipe(fs.createWriteStream(`${outputDir}/${hash}-${activePic}`));
							
							resolve({
								result: true,
								hash: hash,
								key: faces[faces.length - 1]
							});
							
						}
						
					} // if
					
				} // for
				
				if(faces.length === 0) {
					resolve({
						result: false
					});
				}
				
			});
			
		});
		
	}
	
	/**
	 * Detect faces through a list of pics.
	 * This is a "backup" method that will be used if the first one did not throw any faces.
	 * The export method is included.
	 * @param path
	 * @param outputDir
	 * @param hash
	 */
	static guessFaceByAspectRatio(path, outputDir, hash) {
		
		return new Promise(async function(resolve) {
			
			let images = [],
				result = {
					key: null,
					size: 0
				};
			
			
			fs.readdirSync(path).forEach(file => {
				let image = fr.loadImage(`${path}${file}`),
					ratio = Math.max(image.rows, image.cols) / Math.min(image.rows, image.cols);
				
				if(ratio < 2) {
					
					let values = null;
					
					if(ratio === 1) {
						values = image.rows * image.rows;
					} else {
						values = image.rows * image.cols;
					} // if
					
					images[`${file}`] = values;
					
				} // if
				
			});
			
			for(let img in images) {
				
				if(images[img] > result.size) {
					result.key = img;
					result.size = images[img];
				} // if
				
			} // for
			
			if(result.size !== 0) {
				//console.log('Face found with backup algorithm! Coping in faces folder...');
				
				await fs.createReadStream(`${path}${result.key}`)
					.pipe(fs.createWriteStream(`${outputDir}/${hash}-${result.key}`));
				
				resolve({
					result: true,
					hash: hash,
					key: `${outputDir}/${hash}-${result.key}`
				});
				
			} else {
				resolve({
					result: false
				});
			} // if
			
		});
		
	}
	
}

module.exports = ImgParser;