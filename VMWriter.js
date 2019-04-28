const fs = require('fs');

const {
    expParser,
    splitSequence,
    getFunctionCallComponents,
} = require('./ExpressionParser.js');

const opsMap = {
    '+': 'add',
    '-': 'sub',
    '&amp;': 'and',
    '|': 'or',
    '&lt;': 'lt',
    '&gt;': 'gt',
    '=': 'eq',
    '-': 'neg',
    '~': 'not'
};

const segmentMap = {
    'CONST': 'constant',
    'ARG': 'argument',
    'LOCAL': 'local',
    'STATIC': 'static',
    'THIS': 'this',
    'THAT': 'that',
    'POINTER': 'pointer',
    'TEMP': 'temp',
}

class VMWriter {
    constructor(filePath) {
        this.filePath = filePath;
        this.fileStream = fs.createWriteStream(filePath);
    }

    writePush(segment, index) {
        this.fileStream.write(`push ${segmentMap[segment]} ${index}\n`);
    }

    writePop() {

    }

    writeArithmetic(symbol) {
        if(opsMap[symbol]) this.fileStream.write(opsMap[symbol] + '\n');
        else if(symbol === '*') this.writeCall('Math.multiply', 2);
        else if(symbol === '/') this.writeCall('Math.divide', 2);
    }

    writeLabel() {

    }

    writeGoto() {

    }

    writeIf() {

    }

    writeCall(subRoutineName, nArgs) {
        this.fileStream.write(`call ${subRoutineName} ${nArgs}\n`);
    }

    writeFunction(name, numLocals) {
        this.fileStream.write(`function ${name} ${numLocals}\n`);
    }

    writeReturn(value, type) {
        if(type != 'void') this.writeExp(value);
        else this.writePush('CONST', 0);
        this.fileStream.write(`return`);
    }

    close() {
        this.fileStream.close();
    }

    writeExp(expression) {
        const expType = expParser(expression);
        if(expType === 'isWrapped') this.writeExp(expression.substring(1, expression.length - 1));
        if(expType === 'isNumber') this.writePush('CONST', expression);
        if(expType === 'isVarName') this.writePush(expression);
        if(expType === 'isFunctionCall') {
            const components = getFunctionCallComponents(expression);
            components[1].forEach(arg => {
                this.writeExp(arg);
            })
            this.writeCall(components[0], components[1].length);
        }
        if(expType === 'isSequence') {
            const sequence = splitSequence(expression);
            this.writeExp(sequence[0]);
            this.writeExp(sequence[2]);
            this.writeArithmetic(sequence[1]);
        }
    } 
}

module.exports = VMWriter;