const fs = require('fs');

const {
    expParser,
    splitSequence,
    splitSequenceLongOp,
    getFunctionCallComponents,
} = require('./ExpressionParser.js');

const binaryOpsMap = {
    '+': 'add',
    '-': 'sub',
    '&amp;': 'and',
    '|': 'or',
    '&lt;': 'lt',
    '&gt;': 'gt',
    '=': 'eq',
};

const unaryOpsMap = {
    '-': 'neg',
    '~': 'not'
}

// const segmentMap = {
//     'CONST': 'constant',
//     'ARG': 'argument',
//     'LOCAL': 'local',
//     'STATIC': 'static',
//     'THIS': 'this',
//     'THAT': 'that',
//     'POINTER': 'pointer',
//     'TEMP': 'temp',
// }

class VMWriter {
    constructor(filePath) {
        this.filePath = filePath;
        this.fileStream = fs.createWriteStream(filePath);
    }

    writeComment(comment) {
        this.fileStream.write(`\n/* ${comment} */\n\n`.toUpperCase());
    }

    writePush(segment, index) {
        this.fileStream.write(`push ${segment} ${index}\n`);
    }

    writePop(segment, index) {
        this.fileStream.write(`pop ${segment} ${index}\n`);
    }

    writeUnaryOp(symbol) {
        if(unaryOpsMap[symbol]) this.fileStream.write(unaryOpsMap[symbol] + '\n');
    }

    writeBinaryOp(symbol) {
        if(binaryOpsMap[symbol]) this.fileStream.write(binaryOpsMap[symbol] + '\n');
        else if(symbol === '*') this.writeCall('Math.multiply', 2);
        else if(symbol === '/') this.writeCall('Math.divide', 2);
    }

    writeLabel(label) {
        this.fileStream.write(`label ${label}\n`);
    }

    writeGoTo(label) {
        this.fileStream.write(`goto ${label}\n`);
    }

    writeIf(label) {
        this.fileStream.write(`if-goto ${label}\n`);
    }

    writeCall(subRoutineName, nArgs) {
        this.fileStream.write(`call ${subRoutineName} ${nArgs}\n`);
    }

    writeFunction(name, numLocals) {
        this.fileStream.write(`function ${name} ${numLocals}\n`);
    }

    writeReturn(value, type, symbolTable) {
        if(type != 'void') this.writeExp(value, symbolTable);
        else this.writePush('constant', 0);
        this.fileStream.write(`return\n`);
    }

    close() {
        this.fileStream.close();
    }

    writeExp(expression, symbolTable) {
        const expType = expParser(expression);
        if(expType === 'isWrapped') this.writeExp(expression.substring(1, expression.length - 1), symbolTable);
        if(expType === 'isKeywordConstant') {
            if(expression === 'this') { console.log('this') };
            if(expression === 'false' || expression === 'null') this.writePush('constant', 0);
            if(expression === 'true') {
                this.writePush('constant', 1);
                this.writeUnaryOp('-');
            }
        }
        if(expType === 'isNumber') this.writePush('constant', expression);
        if(expType === 'isVarName') {
            const kind = symbolTable.kindOf(expression);
            const index = symbolTable.indexOf(expression);
            this.writePush(kind, index);
        };
        if(expType === 'hasUnaryOp') {
            this.writeExp(expression.slice(1), symbolTable);
            this.writeUnaryOp(expression[0]);
        }
        if(expType === 'isFunctionCall') {
            const components = getFunctionCallComponents(expression);
            components[1].forEach(arg => {
                this.writeExp(arg, symbolTable);
            })
            this.writeCall(components[0], components[1].length);
        }
        if(expType === 'isSequence') {
            const sequence = splitSequence(expression);
            this.writeExp(sequence[0], symbolTable);
            this.writeExp(sequence[2], symbolTable);
            this.writeBinaryOp(sequence[1]);
        }
        if(expType === 'isSequenceWithLongOp') {
            const sequence = splitSequenceLongOp(expression);
            this.writeExp(sequence[0], symbolTable);
            this.writeExp(sequence[2], symbolTable);
            this.writeBinaryOp(sequence[1]);
        }
    } 
}

module.exports = VMWriter;