#!/usr/bin/env node
const ParseUtils = require('./modules/parse-utils');
const program = require('commander');

program
	.version('v1.1.6')
	.option('-f, --file [value]', 'REQUIRED: Add file to parse.')
	.option('--export-dir [value]', 'Select output dir for exported results.')
	.option('-t, --text', 'Get document text')
	.option('-i, --images', 'Find faces inside document')
	.option('-p, --pdf', 'Convert document in pdf')
	.option('-c, --clear', 'Clear result directory')
	.option('-j, --json', 'Export result as JSON')
	.option('-s, --show', 'Show progress in console')
	.parse(process.argv);


if(!program.file) {
	console.log('Please select a resume file...');
} else {
	ParseUtils.createTmpFile(program.file).then(async result => {
		
		let fileToParse = result;
		
		const file = new ParseUtils(fileToParse, __dirname);
		
		await file.parse(program).then(() => {
			console.log(file.result);
			ParseUtils.deleteTmpFile(fileToParse);
		});
	});
} // if



