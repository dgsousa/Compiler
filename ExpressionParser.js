// What about accessing object and array properties ? 

const stringChars = /^[a-zA-Z0-9_.]*$/;
const unaryOp = new Set(['-', '~']);
const ops = new Set(['+', '-', '*', '/', '&amp;', '|', '&lt;', '&gt;', '=']);
const keywords = new Set(['true', 'false', 'null', 'this']);


function expParser(expression) {
    if(isWrapped(expression)) return 'isWrapped';
    if(isKeywordConstant(expression)) return 'isKeywordConstant';
    if(isNumber(expression)) return 'isNumber';
    if(isVarName(expression)) return 'isVarName';
    if(hasUnaryOp(expression)) return 'hasUnaryOp';
    if(isFunctionCall(expression)) return 'isFunctionCall';
    if(isSequence(expression)) return 'isSequence';
    if(isSequenceWithLongOp(expression)) return 'isSequenceWithLongOp';
    throw new Error('Expression is not recognized');
}

function isNumber(expression) {
    return Number(expression) || parseInt(expression) === 0;
}

function isSequence(expression) {
    let counter = 0;
    const length = expression.length;
    while(counter < length && !ops.has(expression[counter])) {
        counter++;
    }
    return ops.has(expression[counter]);
}

function isSequenceWithLongOp(expression) {
    let counter = 0;
    const length = expression.length;
    while(counter < length && !ops.has(expression[counter]) && !ops.has(expression)) {
        if((counter < length - 5) && ops.has(expression.substring(counter, counter + 5))) {
            return true;
        }
        if((counter < length - 4) && ops.has(expression.substring(counter, counter + 4))) {
            return true;
        }
        counter++;
    }
    return false;
}

// still needs to be extended for subProperties !!!
function isVarName(expression) {
    if(Number(expression[0])) return false;
    return stringChars.test(expression);
}

function hasUnaryOp(expression) {
    return unaryOp.has(expression[0]);
}

function isWrapped(expression) {
    const length = expression.length;
    if(expression[0] != '(' || expression[length - 1] != ')') return false;
    return true;
}

function isFunctionCall(expression) {
    const expArray = expression.split('(');
    if(expArray.length <= 1) return false;
    if(!isVarName(expArray[0])) return false;
    if(expression[expression.length - 1] !== ')') return false;
    return true;
}

function splitSequence(expression) {
    let counter = 0;
    let parenCount = 0;
    const length = expression.length;
    while(!(ops.has(expression[counter]) && parenCount === 0)) {
        if(expression[counter] === '(') parenCount++;
        if(expression[counter] === ')') parenCount--;
        counter++;
    }
    return [
        expression.substring(0, counter),
        expression[counter],
        expression.substring(counter + 1, length),
    ];
}

function splitSequenceLongOp(expression) {
    let op = ''
    let length = expression.length;
    let counter = 0;
    let parenCount = 0;
    let hasOp = false;
    while(counter < length && parenCount === 0 && !hasOp) {
        if(counter < length - 5 && expression.substring(counter, counter + 5) === '&amp;') {
            op = '&amp;';
            hasOp = true;
        }
        if(counter < length - 4 && expression.substring(counter, counter + 4) === '&lt;') {
            op = '&lt;';
            hasOp = true;
        }
        if(counter < length - 4 && expression.substring(counter, counter + 4) === '&gt;') {
            op = '&gt;';
            hasOp= true;
        }
        if(expression[counter] === '(') parenCount++;
        if(expression[counter] === ')') parenCount--;
        counter++;
    }
    return [
        expression.substring(0, counter - 1),
        op,
        expression.substring(counter + op.length - 1, length),
    ];
}

function getFunctionCallComponents(expression) {
    const components = [];
    let index = 0;
    let length = expression.length;
    while(index < expression.length && expression[index] !== '(') {
        index++;
    }
    components.push(expression.slice(0, index));
    components.push(
        expression
            .slice(index + 1, length - 1)
            .split(',')
            .filter(arg => arg.length !== 0)
        );
    
    return components;
}

function isKeywordConstant(expression) {
    return keywords.has(expression);
}

module.exports = {
    expParser,
    splitSequence,
    splitSequenceLongOp,
    getFunctionCallComponents,
};