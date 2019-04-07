const fs = require('fs');



class CompilationEngine {
    constructor(filePath) {
        const fileContents = fs.readFileSync(filePath, 'utf-8');
        this.tokenizer = new JackTokenizer(fileContents);
        this.writeStream = fs.createWriteStream(adjustPath(filePath));
        this.compileClass();
    }

    compileClass() {
        while(this.tokenizer.tokenType() !== 'KEYWORD') {
            if(this.tokenizer.hasMoreTokens) this.tokenizer.advance();
        }
        if(this.tokenizer.keyWord() !== 'CLASS') {
            throw new Error('Expected Class declaration');
        }
        writeStream.write('<>')
    }
}

module.exports = CompilationEngine;
