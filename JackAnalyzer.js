const path = require('path');
const fs = require('fs');
const JackTokenizer = require('./JackTokenizer');
// const CompilationEngine = require('./CompilationEngine');

function adjustPath(filePath) {
    return filePath.replace('.jack', 'tt.xml');
}

function analyzer(filePath) {
    if(fs.lstatSync(filePath).isDirectory()) {
        const dir = fs.readdirSync(filePath);
        dir.forEach(child => {
            const fullPath = `${filePath}/${child}`;
            analyzer(fullPath);
        })
    } else {
        if(path.extname(filePath) === '.jack') {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const tokens = new JackTokenizer(fileContents);
            fs.writeFileSync(`${adjustPath(filePath)}`, tokens.join(''));
            // new CompilationEngine(filePath);
        }
    }   
}

analyzer(process.argv[2]);