const fs = require('fs');
const Tokenizer = require('./JackTokenizer');

function adjustPath(filePath) {
    return filePath.replace('.js', '.xml');
}

class CompilationEngine {
    constructor(filePath) {
        this.fileContents = fs.readFileSync(filePath, 'utf-8');
        this.tokenizer = new Tokenizer();
        this.writeStream = fs.createWriteStream(adjustPath(filePath));
    }
}

module.exports = CompilationEngine;
