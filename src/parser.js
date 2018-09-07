const ParseUtils = require('./modules/parse-utils');
const program = require('commander');

program
	.version('Beta.1')
	.option('-f, --file [value]', 'Add file to parse')
	.option('-t, --text', 'Get document text')
	.option('-i, --images', 'Find faces inside document')
	.option('-p, --pdf', 'Convert document in pdf')
	.option('-c, --clear', 'Clear result directory')
	.option('-j, --json', 'Export result as JSON')
	.parse(process.argv);

const file = new ParseUtils(program.file);

if(!program.file) {
	console.log('Please select a resume file...');
} else {
	file.parse(program);
} // if

