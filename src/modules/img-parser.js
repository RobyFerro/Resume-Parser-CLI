const fr = require('face-recognition');
const fs = require('fs');

class ImgParser {
	
	/**
	 * @param file
	 * @param tmpDir
	 * @param hash
	 */
	constructor(file, tmpDir, hash) {
		this.file = file;
		this.image = fr.loadImage(`${tmpDir}/${file}`);
		this.detector = fr.FaceDetector();
		this.tmpDir = tmpDir;
		this.hash = hash;
		this.faces = [];
	}
	
	/**
	 * Detect faces through a list of pics.
	 * This is a "backup" method that will be used if the first one did not throw any faces.
	 * The export method is included.
	 * @param path
	 * @param tmpDir
	 * @param hash
	 */
	static guessFaceByAspectRatio(path, tmpDir, hash) {
		
		let images = [],
			result = {key: null, size: 0};
		
		return new Promise(function(resolve) {
			
			fs.readdirSync(path).forEach(file => {
				let image = fr.loadImage(`${tmpDir}/${file}`),
					ratio = Math.max(image.rows, image.cols) / Math.min(image.rows, image.cols);
				
				if(ratio < 2) {
					
					let values = null;
					
					if(ratio === 1) {
						values = ratio * ratio;
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
			
			console.log(result);
			
			if(result.size !== 0) {
				console.log('Face found! Coping in faces 555 folder...');
				
				fs.createReadStream(`${tmpDir}/${result.key}`)
					.pipe(fs.createWriteStream(`../results/faces/${hash}-${result.key}`));
				
				resolve(true);
			} // if
			
			resolve(false);
		});
		
	}
	
	/**
	 * Detect faces through a list of pics.
	 * This method will be use a face-recognition library
	 */
	detectFaceInPic() {
		
		let main = this;
		
		return new Promise(function(resolve) {
			if(main.image.cols >= 20) {
				main.faces = main.detector.detectFaces(main.image);
			} // if
			
			if(main.faces.length !== 0) {
				let exportFace = main.exportFaces();
				
				exportFace.then(function() {
					resolve(true);
				});
				
			} // if
			
			resolve(false);
		});
		
		
	}
	
	/**
	 * Export faces in result directory
	 */
	exportFaces() {
		
		let main = this;
		
		return new Promise(function(resolve) {
			console.log('Face found! Coping in faces folder...');
			
			fs.createReadStream(`${main.tmpDir}/${main.file}`)
				.pipe(fs.createWriteStream(`../results/faces/${main.hash}-${main.file}`));
			
			resolve();
		});
		
	}
	
	
}

module.exports = ImgParser;