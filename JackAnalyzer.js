
const path = require('path');
const fs = require('fs');

function adjustPath(filePath) {
    return filePath.replace('.jack', '.xml');
}

function analyzer(filePath) {
    if(fs.lstatSync(filePath).isDirectory()) {
        const dir = fs.readdirSync(filePath);
        dir.forEach(child => {
            const fullPath = `${filePath}/${child}`;
            const adjustedPath = adjustPath(fullPath);
            analyzer(adjustedPath);
        })
    } else {
        fs.writeFileSync(filePath, 'test');
    }   
}

analyzer(process.argv[2]);