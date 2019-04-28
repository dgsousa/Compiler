// What about accessing object and array properties ? 

const stringChars = /^[a-zA-Z0-9_.]*$/;
const unaryOp = new Set(['-', '~']);
const ops = new Set(['+', '-', '*', '/', '&amp;', '|', '&lt;', '&gt;', '=']);


function expParser(expression) {
    if(isWrapped(expression)) return 'isWrapped';
    if(Number(expression)) return 'isNumber';
    if(isVarName(expression)) return 'isVarName';
    // if(isUnaryOp(expression)) return 'isUnaryOp';
    if(isFunctionCall(expression)) return 'isFunctionCall';
    if(isSequence(expression)) return 'isSequence';
    throw new Error('Expression is not recognized');
}

function isSequence(expression) {
    let counter = 0;
    const length = expression.length;
    while(counter < length && !ops.has(expression[counter])) {
        counter++;
    }
    return ops.has(expression[counter]);
}

// still needs to be extended for subProperties !!!
function isVarName(expression) {
    if(Number(expression[0])) return false;
    return stringChars.test(expression);
}

function isUnaryOp(expression) {
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
    let before = ''
    let counter = 0;
    let parenCount = 0;
    const length = expression.length;
    while(!(ops.has(expression[counter]) && parenCount === 0)) {
        before += expression[counter];
        if(expression[counter] === '(') parenCount++;
        if(expression[counter] === ')') parenCount--;
        counter++;
    }
    return [
        before,
        expression[counter],
        expression.substring(counter + 1, length),
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

module.exports = {
    expParser,
    splitSequence,
    getFunctionCallComponents
};