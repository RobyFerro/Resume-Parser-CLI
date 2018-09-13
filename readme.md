# Resume Parser CLI
A simple Node.js CLI for parse a resume.

## Requirements
* Node 10.04.*
### Linux dependencies
##### cmake 
###### Fedora:
    yum install cmake
###### Debian:
    apt-get install cmake
##### libopenblas-dev
OPTIONAL Install for improve CPU performance during face recognition:  
###### Fedora:
    yum install openblas-devel.x86_64
###### Debian: 
    sudo apt-get install libopenblas-dev
##### libx11 (XQuartz on OSX)
###### Fedora:
    yum install libX11-devel.x86_64
###### Debian:
    sudo apt-get install libx11-dev
##### libpng 
###### Fedora:
    yum install libpng-devel
###### Debian:
    sudo apt-get install libpng-dev
##### pdftotext 
###### Fedora: 
    yum install poppler-utils
###### Debian:
    sudo apt-get install poppler-utils
##### antiword 
###### Fedora:
    wget https://forensics.cert.org/cert-forensics-tools-release-el7.rpm
    rpm -Uvh cert-forensics-tools-release*rpm
    yum --enablerepo=forensics install antiword
###### Debian: 
    sudo apt-get install antiword
##### unrtf
###### Fedora:
    yum install unrtf
###### Debian:
    sudo apt-get install unrtf
##### tesseract 
###### Fedora:
    yum install tesseract
###### Debian:
    sudo apt-get install tesseract-ocr

### Options
```
rparse -f <filename> <option>
```
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