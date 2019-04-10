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
		return this.tokens[this.tokenIndex] + '\n';
	}

	compileClass() {
		let classDeclaration = '';
		let classIdentifier = '';
		let firstClassBracket = '';
		let classVarDecs = '';
		let subroutineDec = '';
		this.tokenIndex++;
		
		if(this.getTokenType() !== 'keyword' || this.getToken() !== 'class') {
			throw new Error('Expected Class Declaration');
		} else {
			classDeclaration = this.getFullToken();
			this.tokenIndex++;
		}

		if(this.getTokenType() !== 'identifier') {
			throw new Error('Expected Identifier');
		} else {
			classIdentifier = this.getFullToken();
			this.tokenIndex++;
		}

		if(this.getTokenType() !== 'symbol' || this.getToken() !== '{') {
			throw new Error('Expected Symbol {');
		} else {
			firstClassBracket = this.getFullToken();
			this.tokenIndex++;
		}

		while(!subroutineDecs.has(this.getToken())) {
			classVarDecs += this.compileClassVarDec();
		}

		while(this.tokenIndex < this.tokens.length - 2) {
			subroutineDec += this.compileSubroutineDec();
		}

		return (
			'<class>\n' + 
			classDeclaration + 
			classIdentifier +
			firstClassBracket +
			classVarDecs + 
			subroutineDec +
			this.tokens[this.tokens.length - 2] +
			'</class>'
		);
	}

	compileClassVarDec() {
		let fieldOrStaticDec = '';
		let type = '';
		let varName = '';
		let semiColon = '';
		let tokenType = '';
		let token = '';

		// get field or static declaration
		tokenType = this.getTokenType();
		token = this.getToken();
		if(
			tokenType !== 'keyword' ||
			(token !== 'field' && token !== 'static')
		) {
			throw new Error('Expected keyword "field" or "static"');
		} else {
			fieldOrStaticDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get type
		tokenType = this.getTokenType();
		token = this.getToken();
		if(
			tokenType !== 'keyword' && tokenType !== 'identifier'
		) {
			throw new Error('Expected keyword or identifier')
		} else if(
			tokenType === 'keyword' && 
			(token !== 'int' && token !== 'char' && token !== 'boolean')
		) {
			throw new Error('Expected token to be "int", "char", or "boolean"')
		} else {
			type = this.getFullToken();
			this.tokenIndex++;
		}

		// get varName
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
			varName = this.getFullToken();
			this.tokenIndex++;
			if(this.getToken() === ',') {
				while(this.getToken() !== ';') {
					if(this.getToken() !== ',') {
						throw new Error('Expected symbol ","');
					}
					varName += this.getFullToken();
					this.tokenIndex++;
					if(this.getTokenType() !== 'identifier') {
						throw new Error('Expected identifier');
					}
					varName += this.getFullToken();
					this.tokenIndex++;
				}
			}
		}

		// get semiColon
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			semiColon = this.getFullToken();
			this.tokenIndex++;
		}

		return fieldOrStaticDec + type + varName + semiColon;
	}

	compileSubroutineDec() {
		let subroutineDec = '';
		let typeDec = '';
		let subroutineNameDec = '';
		let firstParen = '';
		let parameterList = '';
		let secondParen = '';
		let subroutineBody = '';
		let tokenType = '';
		let token = '';
		
		// get subroutineDec
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'keyword' || !subroutineDecs.has(token)) {
			throw new Error('Expected keyword "constructor", "function", or "method"');
		} else {
			subroutineDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get typeDec
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'keyword' && tokenType !== 'identifier') {
			throw new Error('Expected keyword or identifier');
		} else if(
			tokenType === 'keyword' &&
			!(token === 'void' || token === 'int' || token === 'char' || token === 'boolean')
		 ) {
			throw new Error('Expected keyword void, int, char or boolean');
		} else {
			typeDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get subroutineNameDec
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'identifier') {
			throw new Error('Expected dentifier');
		} else {
			subroutineNameDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get firstParen
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== '(') {
			throw new Error('Expected symbol "("');
		} else {
			firstParen = this.getFullToken();
			this.tokenIndex++;
		}

		// get parameterList
		parameterList = this.compileParameterList();

		// get secondParen
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== ')') {
			throw new Error('Expected symbol ")"');
		} else {
			secondParen = this.getFullToken();
			this.tokenIndex++;
		}

		subroutineBody = this.compileSubroutineBody();

		return (
			subroutineDec +
			typeDec +
			subroutineNameDec +
			firstParen +
			parameterList +
			secondParen +
			subroutineBody
		);
	}

	compileParameterList() {
		let parameterList = '';
		let tokenType = '';
		let token = '';
		while(this.getToken() !== ')') {
			let type = '';
			let varName = '';
			let comma = '';
			
			// get typeDec
			tokenType = this.getTokenType();
			token = this.getToken();
			if(tokenType !== 'keyword' && tokenType !== 'identifier') {
				throw new Error('Expected keyword or identifier');
			} else if(
				tokenType === 'keyword' &&
				!(token === 'void' || token === 'int' || token === 'char' || token === 'boolean')
			 ) {
				throw new Error('Expected keyword void, int, char or boolean');
			} else {
				type = this.getFullToken();
				this.tokenIndex++;
			}

			// get varName
			tokenType = this.getTokenType();
			token = this.getToken();
			if(tokenType !== 'identifier') {
				throw new Error('Expected identifier');
			} else {
				varName = this.getFullToken();
				this.tokenIndex++;
			}

			// get comma
			tokenType = this.getTokenType();
			token = this.getToken();
			if(tokenType === 'symbol' && token === ',') {
				comma = this.getFullToken();
				this.tokenIndex++;
			}

			parameterList += (type + varName + comma);
		}
		return parameterList;
	}

	compileSubroutineBody() {
		let firstBracket = '';
		let varDecs = '';
		let statements = '';
		let lastBracket = '';
		let tokenType = '';
		let token = '';

		// get first bracket
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== '{') {
			throw new Error('Expected Symbol {');
		} else {
			firstBracket = this.getFullToken();
			this.tokenIndex++;
		}

		// get varDecs
		token = this.getToken();
		while(!statementDecs.has(token)) {
			varDecs += this.compileVarDec();
			token = this.getToken();
		}

		// get statements
		statements = this.compileStatements();

		// get last bracket
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== '}') {
			throw new Error('Expected Symbol }');
		} else {
			lastBracket = this.getFullToken();
			this.tokenIndex++;
		}
		return firstBracket + varDecs + statements + lastBracket;
	}

	compileVarDec() {
		let dec = '';
		let type = '';
		let varName = '';
		let semiColon = '';
		let tokenType = '';
		let token = '';

		// get var
		tokenType = this.getTokenType();
		token = this.getToken();
		if(this.getTokenType() !== 'keyword' || this.getToken() !== 'var') {
			throw new Error('Expected keyword var');
		} else {
			dec = this.getFullToken();
			this.tokenIndex++;
		}

		// get typeDec
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'keyword' && tokenType !== 'identifier') {
			throw new Error('Expected keyword or identifier');
		} else if(
			tokenType === 'keyword' &&
			!(token === 'void' || token === 'int' || token === 'char' || token === 'boolean')
		 ) {
			throw new Error('Expected keyword void, int, char or boolean');
		} else {
			type = this.getFullToken();
			this.tokenIndex++;
		}

		// get varName
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
			varName = this.getFullToken();
			this.tokenIndex++;
			if(this.getToken() === ',') {
				while(this.getToken() !== ';') {
					if(this.getToken() !== ',') {
						throw new Error('Expected symbol ","');
					}
					varName += this.getFullToken();
					this.tokenIndex++;
					if(this.getTokenType() !== 'identifier') {
						throw new Error('Expected identifier');
					}
					varName += this.getFullToken();
					this.tokenIndex++;
				}
			}
		}

		// get semiColon
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			semiColon = this.getFullToken();
			this.tokenIndex++;
		}
		return dec + type + varName + semiColon;
	}

	compileStatements() {
		let statements = '';
		let token = this.getToken();
		while(statementDecs.has(token)) {
			if(token === 'let') {
				statements += this.compileLet();
			} else if(token === 'do') {
				statements += this.compileDo();
			} else if(token === 'while') {
				statements += this.compileWhile();
			} else if(token === 'if') {
				statements += this.compileIf();
			} else if(token === 'return') {
				statements += this.compileReturn();
			}
			token = this.getToken();
		}
		return statements;
	}

	compileLet() {
		let letDec = '';
		let varName = '';
		let firstSquareBracket = '';
		let firstExpression = '';
		let lastSquareBracket = '';
		let equals = '';
		let secondExpression = '';
		let semiColon = '';
		let tokenType = '';
		let token = '';

		// get Let
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'keyword' || token !== 'let') {
			throw new Error('Expected keyword "let"');
		} else {
			letDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get varName
		tokenType = this.getTokenType();
		if(tokenType !== 'identifier') {
			throw new Error('Expected identifier');
		} else {
			varName = this.getFullToken();
			this.tokenIndex++;
		}

		// get firstSquareBracket, firstExpress, secondSquareBracket
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType === 'symbol' && token === '[') {
			firstSquareBracket = this.getFullToken();
			this.tokenIndex++;
			firstExpression = this.compileExpression();
			lastSquareBracket = this.getFullToken();
			this.tokenIndex++;
		}

		// get equals
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== '=') {
			throw new Error('Expected symbol =');
		} else {
			equals = this.getFullToken();
			this.tokenIndex++;
			secondExpression = this.compileExpression();
		}

		// get semiColon
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			semiColon = this.getFullToken();
			this.tokenIndex++;
		}

		return (
			letDec +
			varName +
			firstSquareBracket +
			firstExpression +
			lastSquareBracket + 
			equals +
			secondExpression +
			semiColon
		)
	}

	compileIf() {
		let ifDec = '';
		let firstParen = '';
		let expression = '';
		let secondParen = '';
		let firstBracket = '';
		let firstStatements = '';
		let secondBracket = '';
		let elseDec = '';
		let thirdBracket = '';
		let secondStatements = '';
		let fourthBracket = '';
		let tokenType = '';
		let token = '';

		// get if
		let tokenType = this.getTokenType();
		let token = this.getToken();
		if(tokenType !== 'keyword' || token !== 'if') {
			throw new Error('Expected keyword "if"');
		} else {
			ifDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get firstParen, expression, secondParen
		let tokenType = this.getTokenType();
		let token = this.getToken();
		if(tokenType !== 'symbol' || token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			firstParen = this.getFullToken();
			this.tokenIndex++;
			expression = this.compileExpression();
			secondParen = this.getFullToken();
			this.tokenIndex++;
		}

		// get firstBracket, firstStatements, secondBracket
		let tokenType = this.getTokenType();
		let token = this.getToken();
		if(tokenType !== 'symbol' || token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			firstBracket = this.getFullToken();
			this.tokenIndex++;
			firstStatements = this.compileStatements();
			secondBracket = this.getFullToken();
			this.tokenIndex++;
		}

		// get else block
		let tokenType = this.getTokenType();
		let token = this.getToken();
		if(tokenType !== 'keyword' || token !== 'else') {
			throw new Error('Expected keyword else');
		} else {
			thirdBracket = this.getFullToken();
			this.tokenIndex++;
			secondStatements = this.compileStatements();
			fourthBracket = this.getFullToken();
			this.tokenIndex++;
		}

		return (
			ifDec +
			firstParen +
			expression +
			secondParen + 
			firstBracket + 
			firstStatements +
			secondBracket +
			elseDec +
			thirdBracket +
			secondStatements +
			fourthBracket
		)
	}

	compileWhile() {
		let whileDec = '';
		let firstParen = '';
		let expression = '';
		let secondParen = '';
		let firstBracket = '';
		let statements = '';
		let secondBracket = '';
		let tokenType = '';
		let token = '';

		// get while
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'keyword' || token !== 'while') {
			throw new Error('Expected keyword "while"');
		} else {
			whileDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get firstParen, expression, secondParen
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			firstParen = this.getFullToken();
			this.tokenIndex++;
			expression = this.compileExpression();
			secondParen = this.getFullToken();
			this.tokenIndex++;
		}

		// get firstBracket, statements, secondBracket
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			firstBracket = this.getFullToken();
			this.tokenIndex++;
			statements = this.compileStatements();
			secondBracket = this.getFullToken();
			this.tokenIndex++;
		}

		return (
			whileDec +
			firstParen +
			expression +
			secondParen +
			firstBracket +
			statements +
			secondBracket
		)
	}

	compileDo() {
		let doDec = '';
		let subroutineCall = '';
		let semiColon = '';
		let tokenType = '';
		let token = '';

		// get do
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'keyword' || token !== 'do') {
			throw new Error('Expected keyword "do"');
		} else {
			doDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get subroutineCall
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'identifier') {
			throw new Error('Expected identifer');
		} else {
			subroutineCall += this.getFullToken();
			this.tokenIndex++;
			tokenType = this.getTokenType();
			token = this.getToken();
			if(tokenType === 'symbol' && token === '.') {
				subroutineCall += this.getFullToken();
				this.tokenIndex++;
				tokenType = this.getTokenType();
				if(tokenType !== 'identifier') {
					throw new Error('Expected identifer');
				}
				subroutineCall += this.getFullToken();
				this.tokenIndex++;
			}
		}

		// get leftParen
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== '(') {
			throw new Error('Expected symbol "("');
		} else {
			subroutineCall += this.getFullToken();
			this.tokenIndex++;
		}

		// get arguments
		tokenType = this.getTokenType();
		token = this.getToken();
		if(token !== ')') {
			subroutineCall += this.compileExpressionList();
		}

		// get rightParen
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== ')') {
			throw new Error('Expected symbol ")"');
		} else {
			subroutineCall += this.getFullToken();
			this.tokenIndex++;
		}

		// get semiColon
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			semiColon = this.getFullToken();
			this.tokenIndex++;
		}

		return doDec + subroutineCall + semiColon;
	}

	compileReturn() {
		let returnDec = '';
		let expression = '';
		let semiColon = '';
		let tokenType = '';
		let token = '';

		// get return
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'keyword' || token !== 'return') {
			throw new Error('Expected keyword "return"');
		} else {
			returnDec = this.getFullToken();
			this.tokenIndex++;
		}

		// get expression
		token = this.getToken();
		if(token !== ';') {
			expression = this.compileExpression();
		}
		// get semiColon
		tokenType = this.getTokenType();
		token = this.getToken();
		if(tokenType !== 'symbol' || token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			semiColon = this.getFullToken();
			this.tokenIndex++;
		}

		return returnDec + expression + semiColon;
	}

	compileTerm() {
		let term = '';
		let tokenType = '';
		let token = '';

		tokenType = this.getTokenType();
		token = this.getToken();
		if(
			tokenType === 'integerConstant' ||
			tokenType === 'stringConstant'  ||
			keywordConstants.has(token)
		) {
			term += this.getFullToken();
			this.tokenIndex++;
		} else if(tokenType === 'identifier') {
			term += this.getFullToken();
			this.tokenIndex++;
			tokenType = this.getTokenType();
			token = this.getToken();
			if(tokenType === 'symbol' && token === '[') {
				term += this.getFullToken();
				this.tokenIndex++;
				term += this.compileExpression();
				term += this.getFullToken();
				this.tokenIndex++;
			} else if(tokenType === 'symbol' && token === '(') {
				term += this.getFullToken();
				this.tokenIndex++;
				tokenType = this.getTokenType();
				token = this.getToken();
				if(token !== ')') {
					term += this.compileExpressionList();
				}
				tokenType = this.getTokenType();
				token = this.getToken();
				if(tokenType !== 'symbol' || token !== ')') {
					throw new Error('Expected symbol ")"');
				} else {
					term += this.getFullToken();
					this.tokenIndex++;
				}
			} else if(tokenType === 'symbol' && token === '.') {
				term += this.getFullToken();
				this.tokenIndex++;
				tokenType = this.getTokenType();
				if(tokenType !== 'identifier') {
					throw new Error("Expected identifier");
				}
				term += this.getFullToken();
				this.tokenIndex++;
				tokenType = this.getTokenType();
				token = this.getToken();
				if(tokenType !== 'symbol' || token !== '(') {
					throw new Error("Expected symbol (");
				}
				term += this.getFullToken();
				this.tokenIndex++;
				term += this.compileExpressionList();
				tokenType = this.getTokenType();
				token = this.getToken();
				if(tokenType !== 'symbol' || token !== ')') {
					throw new Error("Expected symbol )");
				}
				term += this.getFullToken();
				this.tokenIndex++;
			}
		} else if(tokenType === 'symbol' && token === '(') {
			term += this.getFullToken();
			this.tokenIndex++;
			term += this.compileExpression();
			term += this.getFullToken();
			this.tokenIndex++;
		} else if(tokenType === 'symbol' && unaryOp.has(token)) {
			term += this.getFullToken();
			this.tokenIndex++;
			term += this.compileTerm();
		}
		return term;
	}

	compileExpression() {
		let term = '';
		let token = '';

		term += this.compileTerm();
		token = this.getToken();
		while(ops.has(token)) {
			term += this.getFullToken();
			this.tokenIndex++;
			term += this.compileTerm();
			token = this.getToken();
		}
		return term;
	}

	compileExpressionList() {
		let expressionList = this.compileExpression();
		let token = this.getToken();
		while(token !== ')') {
			expressionList += this.getFullToken();
			this.tokenIndex++;
			expressionList += this.compileExpression();
			token = this.getToken();
		}
		return expressionList;
	}


}

module.exports = CompilationEngine;
