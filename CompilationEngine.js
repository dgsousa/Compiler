const fs = require('fs');
const SymbolTable = require('./SymbolTable');
const VMWriter = require('./VMWriter');

const subroutineDecs = new Set(['constructor', 'function', 'method']);
const statementDecs = new Set(['let', 'if', 'else', 'while', 'do', 'return']);
const keywordConstants = new Set(['true', 'false', 'null', 'this']);
const ops = new Set(['+', '-', '*', '/', '&amp;', '|', '&lt;', '&gt;', '=']);
const unaryOp = new Set(['-', '~']);

function formatDec(codeString, decType) {
	return `<${decType}>\n${codeString}</${decType}>\n`;
}

class CompilationEngine {
	constructor(filePath, tokens) {
		this.symbolTable;
		this.vmWriter = new VMWriter(filePath);
		this.type = '';
		this.currentSubroutineName = '';
		this.symbolTable = new SymbolTable();
		this.tokenIndex = 0;
		this.tokens = tokens;
		this.compiledTokens = this.compileClass();
		fs.writeFileSync(filePath, this.compiledTokens);
	}

	getTokenType() {
		return this.tokens[this.tokenIndex].split('>')[0].split('<')[1];
	}

	getToken() {
		return this.tokens[this.tokenIndex].split('>')[1].split('<')[0].trim();
	}

	getFullToken() {
		const fullToken = this.tokens[this.tokenIndex] + '\n';
		this.tokenIndex++;
		this.tokenType = this.getTokenType();
		this.token = this.getToken();
		return fullToken;
	}

	compileClass() {
		let classDec = '';
		this.getFullToken();
		
		if(this.tokenType !== 'keyword' || this.token !== 'class') {
			throw new Error('Expected Class Declaration');
		} else {
			classDec += this.getFullToken();
		}

		if(this.tokenType !== 'identifier') {
			throw new Error('Expected Identifier');
		} else {
			this.type = this.getToken();
			classDec += this.getFullToken();
		}

		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected Symbol {');
		} else {
			classDec += this.getFullToken();
		}
		
		while(!subroutineDecs.has(this.token)) {
			classDec += this.compileClassVarDec();
		}

		while(this.tokenIndex < this.tokens.length - 2) {
			classDec += this.compileSubroutineDec();
		}

		if(this.tokenType !== 'symbol' || this.token !== '}') {
			throw new Error('Expected Symbol }');
		} else {
			classDec += this.getFullToken();
		}
		console.log('classVars', this.symbolTable.classVars);
		return formatDec(classDec, 'class');
	}

	compileClassVarDec() {
		let classVarDec = '';
		let name = '';
		let type = '';
		let kind = '';
		

		// get field or static declaration
		if(
			this.tokenType !== 'keyword' ||
			(this.token !== 'field' && this.token !== 'static')
		) {
			throw new Error('Expected keyword "field" or "static"');
		} else {
			kind = this.getToken();
			classVarDec += this.getFullToken();
		}

		// get type
		if(this.tokenType !== 'keyword' && this.tokenType !== 'identifier') {
			throw new Error('Expected keyword or identifier')
		} else if(this.tokenType === 'keyword' && (this.token !== 'int' && this.token !== 'char' && this.token !== 'boolean')) {
			throw new Error('Expected token to be "int", "char", or "boolean"')
		} else {
			type = this.getToken();
			classVarDec += this.getFullToken();
		}

		// get varName
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
			name = this.getToken();
			this.symbolTable.define(name, type, kind);
			classVarDec += this.getFullToken();
			if(this.token === ',') {
				while(this.token !== ';') {
					if(this.token !== ',') {
						throw new Error('Expected symbol ","');
					}
					classVarDec += this.getFullToken();
					if(this.tokenType !== 'identifier') {
						throw new Error('Expected identifier');
					}
					name = this.getToken();
					this.symbolTable.define(name, type, kind);
					classVarDec += this.getFullToken();
				}
			}
		}

		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			classVarDec += this.getFullToken();
		}

		return formatDec(classVarDec, 'classVarDec');
	}

	compileSubroutineDec() {
		let subroutineDec = '';
		let kind = '';

		// get subroutineDec
		if(this.tokenType !== 'keyword' || !subroutineDecs.has(this.token)) {
			throw new Error('Expected keyword "constructor", "function", or "method"');
		} else {
			kind = this.getToken();
			subroutineDec += this.getFullToken();
		}

		// get typeDec
		if(this.tokenType !== 'keyword' && this.tokenType !== 'identifier') {
			throw new Error('Expected keyword or identifier');
		} else if(
			this.tokenType === 'keyword' &&
			!(this.token === 'void' || this.token === 'int' || this.token === 'char' || this.token === 'boolean')
		 ) {
			throw new Error('Expected keyword void, int, char or boolean');
		} else {
			subroutineDec += this.getFullToken();
		}

		// get subroutineNameDec
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected dentifier');
		} else {
			this.subRoutineName = this.getToken();
			this.symbolTable.startSubroutine(this.type, kind);
			subroutineDec += this.getFullToken();
		}

		// get firstParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol "("');
		} else {
			subroutineDec += this.getFullToken();
		}

		// get parameterList
		subroutineDec += this.compileParameterList();

		// get secondParen
		if(this.tokenType !== 'symbol' || this.token !== ')') {
			throw new Error('Expected symbol ")"');
		} else {
			subroutineDec += this.getFullToken();
		}

		subroutineDec += this.compileSubroutineBody();
		console.log('subRoutineVars', this.symbolTable.subRoutineVars);
		return formatDec(subroutineDec, 'subroutineDec');
	}

	compileParameterList() {
		let parameterList = '';
		let name = '';
		let type = '';
		let kind = 'argument';
		
		while(this.token !== ')') {	
			// get typeDec
			if(this.tokenType !== 'keyword' && this.tokenType !== 'identifier') {
				throw new Error('Expected keyword or identifier');
			} else if(
				this.tokenType === 'keyword' &&
				!(this.token === 'void' || this.token === 'int' || this.token === 'char' || this.token === 'boolean')
			 ) {
				throw new Error('Expected keyword void, int, char or boolean');
			} else {
				type = this.getToken();
				parameterList += this.getFullToken();
			}

			// get varName
			if(this.tokenType !== 'identifier') {
				throw new Error('Expected identifier');
			} else {
				name = this.getToken();
				this.symbolTable.define(name, type, kind);
				parameterList += this.getFullToken();
			}

			// get comma
			if(this.tokenType === 'symbol' && this.token === ',') {
				parameterList += this.getFullToken();
			}
		}
		return formatDec(parameterList, 'parameterList');
	}

	compileSubroutineBody() {
		let subroutineBody = '';

		// get first bracket
		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected Symbol {');
		} else {
			subroutineBody += this.getFullToken();
		}

		// get varDecs
		while(!statementDecs.has(this.token)) {
			subroutineBody += this.compileVarDec();
		}


		this.vmWriter.writeFunction(`${this.type}.${this.subRoutineName}`, this.symbolTable.varCount('local'));

		// get statements
		subroutineBody += this.compileStatements();

		// get last bracket
		if(this.tokenType !== 'symbol' || this.token !== '}') {
			throw new Error('Expected Symbol }');
		} else {
			subroutineBody += this.getFullToken();
		}
		return formatDec(subroutineBody, 'subroutineBody');
	}

	compileVarDec() {
		let varDec = '';
		let name = '';
		let type = '';
		let kind = 'var';

		// get var
		if(this.tokenType !== 'keyword' || this.token !== 'var') {
			throw new Error('Expected keyword var');
		} else {
			varDec += this.getFullToken();
		}

		// get typeDec
		if(this.tokenType !== 'keyword' && this.tokenType !== 'identifier') {
			throw new Error('Expected keyword or identifier');
		} else if(
			this.tokenType === 'keyword' &&
			!(this.token === 'void' || this.token === 'int' || this.token === 'char' || this.token === 'boolean')
		 ) {
			throw new Error('Expected keyword void, int, char or boolean');
		} else {
			type = this.getToken();
			varDec += this.getFullToken();
		}

		// get varName
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
			name = this.getToken();
			this.symbolTable.define(name, type, kind);
			varDec += this.getFullToken();
			if(this.token === ',') {
				while(this.token !== ';') {
					if(this.token !== ',') {
						throw new Error('Expected symbol ","');
					}
					varDec += this.getFullToken();
					if(this.tokenType !== 'identifier') {
						throw new Error('Expected identifier');
					}
					name = this.getToken();
					this.symbolTable.define(name, type, kind);
					varDec += this.getFullToken();
				}
			}
		}

		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			varDec += this.getFullToken();
		}
		return formatDec(varDec, 'varDec');
	}

	compileStatements() {
		let statements = '';
		while(statementDecs.has(this.token)) {
			if(this.token === 'let') {
				statements += this.compileLet();
			} else if(this.token === 'do') {
				statements += this.compileDo();
			} else if(this.token === 'while') {
				statements += this.compileWhile();
			} else if(this.token === 'if') {
				statements += this.compileIf();
			} else if(this.token === 'return') {
				statements += this.compileReturn();
			}
		}
		return formatDec(statements, 'statements');
	}

	compileLet() {
		let letStatement = '';

		// get Let
		if(this.tokenType !== 'keyword' || this.token !== 'let') {
			throw new Error('Expected keyword "let"');
		} else {
			letStatement += this.getFullToken();
		}

		// get varName
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
			letStatement += this.getFullToken();
		}

		// get firstSquareBracket, firstExpress, secondSquareBracket
		if(this.tokenType === 'symbol' && this.token === '[') {
			letStatement += this.getFullToken();
			letStatement += this.compileExpression();
			letStatement += this.getFullToken();
		}

		// get equals
		if(this.tokenType !== 'symbol' || this.token !== '=') {
			throw new Error('Expected symbol =');
		} else {
			letStatement += this.getFullToken();
			letStatement += this.compileExpression();
		}

		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			letStatement += this.getFullToken();
		}

		return formatDec(letStatement, 'letStatement');
	}

	compileIf() {
		let ifStatement = '';

		// get if
		if(this.tokenType !== 'keyword' || this.token !== 'if') {
			throw new Error('Expected keyword "if"');
		} else {
			ifStatement += this.getFullToken();
		}

		// get firstParen, expression, secondParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			ifStatement += this.getFullToken();
			ifStatement += this.compileExpression();
			ifStatement += this.getFullToken();

		}
		// get firstBracket, firstStatements, secondBracket
		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			ifStatement += this.getFullToken();
			ifStatement += this.compileStatements();
			ifStatement += this.getFullToken();

		}

		// get else block
		if(this.tokenType === 'keyword' && this.token === 'else') {
			ifStatement += this.getFullToken();
			if(this.tokenType !== 'symbol' || this.token !== '{') {
				throw new Error('Expected symbol "{"') 
			} else {
				ifStatement += this.getFullToken();
				ifStatement += this.compileStatements();
				ifStatement += this.getFullToken();
			}
		}

		return formatDec(ifStatement, 'ifStatement');
	}

	compileWhile() {
		let whileStatement = '';

		// get while
		if(this.tokenType !== 'keyword' || this.token !== 'while') {
			throw new Error('Expected keyword "while"');
		} else {
			whileStatement += this.getFullToken();
		}

		// get firstParen, expression, secondParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			whileStatement += this.getFullToken();
			whileStatement += this.compileExpression();
			whileStatement += this.getFullToken();
		}

		// get firstBracket, statements, secondBracket
		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			whileStatement += this.getFullToken();
			whileStatement += this.compileStatements();
			whileStatement += this.getFullToken();

		}

		return formatDec(whileStatement, 'whileStatement');
	}

	compileDo() {
		let doStatement = '';

		// get do
		if(this.tokenType !== 'keyword' || this.token !== 'do') {
			throw new Error('Expected keyword "do"');
		} else {
			doStatement += this.getFullToken();
		}

		// get subroutineCall
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifer');
		} else {
			doStatement += this.getFullToken();
			if(this.tokenType === 'symbol' && this.token === '.') {
				doStatement += this.getFullToken();
				if(this.tokenType !== 'identifier') {
					throw new Error('Expected identifer');
				}
				doStatement += this.getFullToken();
			}
		}

		// get leftParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol "("');
		} else {
			doStatement += this.getFullToken();
		}

		// get arguments
		doStatement += this.compileExpressionList();

		// get rightParen
		if(this.tokenType !== 'symbol' || this.token !== ')') {
			throw new Error('Expected symbol ")"');
		} else {
			doStatement += this.getFullToken();
		}

		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			doStatement += this.getFullToken();
		}

		return formatDec(doStatement, 'doStatement');
	}

	compileReturn() {
		let returnStatement = '';

		// get return
		if(this.tokenType !== 'keyword' || this.token !== 'return') {
			throw new Error('Expected keyword "return"');
		} else {
			returnStatement += this.getFullToken();
		}
		// get expression
		if(this.token !== ';') {
			returnStatement += this.compileExpression();
		}
		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			returnStatement += this.getFullToken();
		}

		return formatDec(returnStatement, 'returnStatement');
	}

	compileTerm() {
		let term = '';

		if(
			this.tokenType === 'integerConstant' ||
			this.tokenType === 'stringConstant'  ||
			keywordConstants.has(this.token)
		) {
			term += this.getFullToken();
		} else if(this.tokenType === 'identifier') {
			term += this.getFullToken();
			if(this.tokenType === 'symbol' && this.token === '[') {
				term += this.getFullToken();
				term += this.compileExpression();
				term += this.getFullToken();
	
			} else if(this.tokenType === 'symbol' && this.token === '(') {
				term += this.getFullToken();
				term += this.compileExpressionList();
				if(this.tokenType !== 'symbol' || this.token !== ')') {
					throw new Error('Expected symbol ")"');
				} else {
					term += this.getFullToken();
				}
			} else if(this.tokenType === 'symbol' && this.token === '.') {
				term += this.getFullToken();
				if(this.tokenType !== 'identifier') {
					throw new Error("Expected identifier");
				}
				term += this.getFullToken();
				if(this.tokenType !== 'symbol' || this.token !== '(') {
					throw new Error("Expected symbol (");
				}
				term += this.getFullToken();
				term += this.compileExpressionList();
				if(this.tokenType !== 'symbol' || this.token !== ')') {
					throw new Error("Expected symbol )");
				}
				term += this.getFullToken();
			}
		} else if(this.tokenType === 'symbol' && this.token === '(') {
			term += this.getFullToken();
			term += this.compileExpression();
			term += this.getFullToken();

		} else if(this.tokenType === 'symbol' && unaryOp.has(this.token)) {
			term += this.getFullToken();
			term += this.compileTerm();
		}
		return formatDec(term, 'term');
	}

	compileExpression() {
		let expression = '';

		expression += this.compileTerm();
		while(ops.has(this.token)) {
			expression += this.getFullToken();
			expression += this.compileTerm();
		}
		return formatDec(expression, 'expression');
	}

	compileExpressionList() {
		let expressionList = '';

		if(this.token !== ')') {
			expressionList += this.compileExpression();
		}

		while(this.token !== ')') {
			expressionList += this.getFullToken();
			expressionList += this.compileExpression();
		}
		return formatDec(expressionList, 'expressionList');
	}

}

module.exports = CompilationEngine;
