const fs = require('fs');

const subroutineDecs = new Set(['constructor', 'function', 'method']);
const statementDecs = new Set(['let', 'if', 'else', 'while', 'do', 'return']);
const keywordConstants = new Set(['true', 'false', 'null', 'this']);
const ops = new Set(['+', '-', '*', '/', '&amp;', '|', '&lt;', '&gt;', '=']);
const unaryOp = new Set(['-', '~']);

class CompilationEngine {
	constructor(filePath, tokens) {
		this.tokenIndex = 0;
		this.tokens = tokens;
		console.log(tokens);
		this.compiledTokens = this.compileClass();
		console.log(this.compiledTokens);
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
			console.log(this.tokenType, this.token);
			throw new Error('Expected Class Declaration');
		} else {
			classDec += this.getFullToken();
		}

		if(this.tokenType !== 'identifier') {
			throw new Error('Expected Identifier');
		} else {
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

		return (
			'<class>\n' + 
			classDec +
			this.tokens[this.tokens.length - 2] +
			'</class>'
		);
	}

	compileClassVarDec() {
		let classVarDec = '';

		// get field or static declaration
		if(
			this.tokenType !== 'keyword' ||
			(this.token !== 'field' && this.token !== 'static')
		) {
			throw new Error('Expected keyword "field" or "static"');
		} else {
			classVarDec += this.getFullToken();
		}

		// get type
		if(this.tokenType !== 'keyword' && this.tokenType !== 'identifier') {
			throw new Error('Expected keyword or identifier')
		} else if(this.tokenType === 'keyword' && (this.token !== 'int' && this.token !== 'char' && this.token !== 'boolean')) {
			throw new Error('Expected token to be "int", "char", or "boolean"')
		} else {
			classVarDec += this.getFullToken();
		}

		// get varName
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
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

		return classVarDec;
	}

	compileSubroutineDec() {
		let subroutineDec = '';
		
		// get subroutineDec
		if(this.tokenType !== 'keyword' || !subroutineDecs.has(this.token)) {
			throw new Error('Expected keyword "constructor", "function", or "method"');
		} else {
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

		return subroutineDec;
	}

	compileParameterList() {
		let parameterList = '';
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
				parameterList += this.getFullToken();
			}

			// get varName
			if(this.tokenType !== 'identifier') {
				throw new Error('Expected identifier');
			} else {
				parameterList += this.getFullToken();
			}

			// get comma
			if(this.tokenType === 'symbol' && this.token === ',') {
				parameterList += this.getFullToken();
			}
		}
		return parameterList;
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

		// get statements
		subroutineBody += this.compileStatements();

		// get last bracket
		if(this.tokenType !== 'symbol' || this.token !== '}') {
			throw new Error('Expected Symbol }');
		} else {
			subroutineBody += this.getFullToken();
		}
		return subroutineBody;
	}

	compileVarDec() {
		let varDec = '';

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
			varDec += this.getFullToken();
		}

		// get varName
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
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
		return varDec;
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
		return statements;
	}

	compileLet() {
		let letDec = '';

		// get Let
		if(this.tokenType !== 'keyword' || this.token !== 'let') {
			throw new Error('Expected keyword "let"');
		} else {
			letDec += this.getFullToken();
		}

		// get varName
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
			letDec += this.getFullToken();
		}

		// get firstSquareBracket, firstExpress, secondSquareBracket
		if(this.tokenType === 'symbol' && this.token === '[') {
			letDec += this.getFullToken();
			letDec += this.compileExpression();
			letDec += this.getFullToken();
		}

		// get equals
		if(this.tokenType !== 'symbol' || this.token !== '=') {
			throw new Error('Expected symbol =');
		} else {
			letDec += this.getFullToken();
			letDec += this.compileExpression();
		}

		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			letDec += this.getFullToken();
		}

		return letDec;
	}

	compileIf() {
		let ifDec = '';

		// get if
		if(this.tokenType !== 'keyword' || this.token !== 'if') {
			throw new Error('Expected keyword "if"');
		} else {
			ifDec += this.getFullToken();
		}

		// get firstParen, expression, secondParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			ifDec += this.getFullToken();
			ifDec += this.compileExpression();
			ifDec += this.getFullToken();

		}

		// get firstBracket, firstStatements, secondBracket
		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			ifDec += this.getFullToken();
			ifDec += this.compileStatements();
			ifDec += this.getFullToken();

		}

		// get else block
		if(this.tokenType !== 'keyword' || this.token !== 'else') {
			throw new Error('Expected keyword else');
		} else {
			ifDec += this.getFullToken();
			ifDec += this.compileStatements();
			ifDec += this.getFullToken();
		}

		return ifDec;
	}

	compileWhile() {
		let whileDec = '';

		// get while
		if(this.tokenType !== 'keyword' || this.token !== 'while') {
			throw new Error('Expected keyword "while"');
		} else {
			whileDec += this.getFullToken();
		}

		// get firstParen, expression, secondParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			whileDec += this.getFullToken();
			whileDec += this.compileExpression();
			whileDec += this.getFullToken();
		}

		// get firstBracket, statements, secondBracket
		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			whileDec += this.getFullToken();
			whileDec += this.compileStatements();
			whileDec += this.getFullToken();

		}

		return whileDec
	}

	compileDo() {
		let doDec = '';

		// get do
		if(this.tokenType !== 'keyword' || this.token !== 'do') {
			throw new Error('Expected keyword "do"');
		} else {
			doDec += this.getFullToken();
		}

		// get subroutineCall
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifer');
		} else {
			doDec += this.getFullToken();
			if(this.tokenType === 'symbol' && this.token === '.') {
				doDec += this.getFullToken();
				if(this.tokenType !== 'identifier') {
					throw new Error('Expected identifer');
				}
				doDec += this.getFullToken();
			}
		}

		// get leftParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol "("');
		} else {
			doDec += this.getFullToken();
		}

		// get arguments
		if(this.token !== ')') {
			doDec += this.compileExpressionList();
		}

		// get rightParen
		if(this.tokenType !== 'symbol' || this.token !== ')') {
			throw new Error('Expected symbol ")"');
		} else {
			doDec += this.getFullToken();
		}

		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			doDec += this.getFullToken();
		}

		return doDec;
	}

	compileReturn() {
		let returnDec = '';

		// get return
		if(this.tokenType !== 'keyword' || this.token !== 'return') {
			throw new Error('Expected keyword "return"');
		} else {
			returnDec += this.getFullToken();
		}

		// get expression
		if(this.token !== ';') {
			returnDec += this.compileExpression();
		}
		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			returnDec += this.getFullToken();
		}

		return returnDec;
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
				if(this.token !== ')') {
					term += this.compileExpressionList();
				}
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
		return term;
	}

	compileExpression() {
		let term = '';

		term += this.compileTerm();
		while(ops.has(this.token)) {
			term += this.getFullToken();
			term += this.compileTerm();
		}
		return term;
	}

	compileExpressionList() {
		let expressionList = this.compileExpression();
		while(this.token !== ')') {
			expressionList += this.getFullToken();
			expressionList += this.compileExpression();
		}
		return expressionList;
	}


}

module.exports = CompilationEngine;
