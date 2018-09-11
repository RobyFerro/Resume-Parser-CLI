const ParseUtils = require('./modules/parse-utils');
const program = require('commander');

program
	.version('Beta.1')
	.option('-f, --file [value]', 'REQUIRED: Add file to parse.')
	.option('-t, --text', 'Get document text')
	.option('-i, --images', 'Find faces inside document')
	.option('-p, --pdf', 'Convert document in pdf')
	.option('-c, --clear', 'Clear result directory')
	.option('-j, --json', 'Export result as JSON')
	.option('-s, --show', 'Show progress in console')
	.option('--face-dir [value]', 'Select output dir for face img. This option require -i command')
	.option('--converted-dir [value]', 'Select output dir converted pdf. This option require -p command')
	.parse(process.argv);

const file = new ParseUtils(program.file);

if(!program.file) {
	console.log('Please select a resume file...');
} else {
	file.parse(program).then(result => {
		console.log(file.result);
	});
} // if

