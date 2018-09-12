# Resume Parser CLI
A simple Node.js CLI for parse a resume. [Official GitHub Repository](https://github.com/RobyFerro/DocumentParserCLI)

### Requirements

##### Linux 
* cmake
* libx11 (XQuartz on OSX) for the dlib GUI (sudo apt-get install libx11-dev)
* libpng for reading images (sudo apt-get install libpng-dev)
* libopenblas-dev
* pdftotext 
* antiword 
* unrtf 
* tesseract 
* drawingtotext 
* poppler-utils

### Options
```
    -V, --version            output the version number
    -f, --file [value]       REQUIRED: Add file to parse.
    -t, --text               Get document text
    -i, --images             Find faces inside document
    -p, --pdf                Convert document in pdf
    -c, --clear              Clear result directory
    -j, --json               Export result as JSON
    -s, --show               Show progress in console
    --face-dir [value]       Select output dir for face img. This option require -i command
    --converted-dir [value]  Select output dir converted pdf. This option require -p command
    -h, --help               output usage information
```