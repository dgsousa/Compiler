
const fs = require('fs');
const CompilationEngine = require('./CompilationEngine');

function analyzer(filePath) {
    if(fs.lstatSync(filePath).isDirectory()) {
        const dir = fs.readdirSync(filePath);
        dir.forEach(child => {
            const fullPath = `${filePath}/${child}`;
            analyzer(fullPath);
        })
    } else {
        new CompilationEngine(filePath);
    }   
}

analyzer(process.argv[2]);