const SymbolTable = require('./SymbolTable.js');
const VMWriter = require('./VMWriter.js');

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
		this.subroutineName = '';
		this.subroutineType = '';
		this.subroutineKind = '';
		this.labelIndex = 0;
		this.symbolTable = new SymbolTable();
		this.tokenIndex = 0;
		this.tokens = tokens;
		this.compiledTokens = this.compileClass();
		// fs.writeFileSync(filePath, this.compiledTokens);
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
		// get subroutineDec
		if(this.tokenType !== 'keyword' || !subroutineDecs.has(this.token)) {
			throw new Error('Expected keyword "constructor", "function", or "method"');
		} else {
			this.subRoutineKind = this.getToken();
			this.getFullToken(); // advance
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
			this.subRoutineType = this.getToken();
			this.getFullToken(); // advance
		}

		// get subroutineNameDec
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected dentifier');
		} else {
			this.subRoutineName = this.getToken();
			this.symbolTable.startSubroutine(this.type, this.subRoutineKind);
			this.getFullToken(); // advance
		}

		// get firstParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol "("');
		} else {
			this.getFullToken(); // advance
		}

		// get parameterList
		this.compileParameterList();  // DONT FORGET

		// get secondParen
		if(this.tokenType !== 'symbol' || this.token !== ')') {
			throw new Error('Expected symbol ")"');
		} else {
			this.getFullToken(); // advance
		}

		this.compileSubroutineBody();
		return '';
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

		// has to come after all the local vars have been added to SymbolTable
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
		let varName = '';
		let expression = '';
		let index;
		let kind = '';


		// get Let
		if(this.tokenType !== 'keyword' || this.token !== 'let') throw new Error('Expected keyword "let"');
		else {
			this.getFullToken(); // advance
		}

		// get varName
		if(this.tokenType !== 'identifier') throw new Error('Expected identifier');
		else {
			varName += this.getToken();
			this.getFullToken(); // advance
		}

		// get firstSquareBracket, firstExpress, secondSquareBracket
		if(this.tokenType === 'symbol' && this.token === '[') { // DONT FORGET
			varName += this.getFullToken();
			varName += this.compileExpression();
			varName += this.getFullToken(); // advance
		}
		
		// get equals
		if(this.tokenType !== 'symbol' || this.token !== '=') throw new Error('Expected symbol =');
		else {
			this.getFullToken(); // advance
			expression += this.compileExpression();
		}

		kind = this.symbolTable.kindOf(varName);
		index = this.symbolTable.indexOf(varName);
		this.vmWriter.writeExp(expression, this.symbolTable);
		this.vmWriter.writePop(kind, index);
		
		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			this.getFullToken(); // advance
		}
		return '';
	}

	compileIf() {
		let expression = '';
		let ifStatements = '';
		let elseStatements = '';

		// get if
		if(this.tokenType !== 'keyword' || this.token !== 'if') {
			throw new Error('Expected keyword "if"');
		} else {
			this.getFullToken(); // advance
		}

		// get firstParen, expression, secondParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			this.getFullToken(); // advance
			expression += this.compileExpression();
			this.getFullToken(); // advance

		}
		// get firstBracket, firstStatements, secondBracket
		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			this.getFullToken(); // advance
			ifStatements += this.compileStatements();
			this.getFullToken(); // advance

		}

		// get else block
		if(this.tokenType === 'keyword' && this.token === 'else') {
			this.getFullToken(); // advance
			if(this.tokenType !== 'symbol' || this.token !== '{') {
				throw new Error('Expected symbol "{"') 
			} else {
				this.getFullToken(); // advance
				elseStatements += this.compileStatements();
				this.getFullToken(); // advance
			}
		}

		this.vmWriter.writeExp(expression, this.symbolTable);
		this.vmWriter.writeUnaryOp('~');
		this.vmWriter.writeIf(`${this.type}L${this.labelIndex + 1}`);
		// execute ifStatements
		this.vmWriter.writeGoTo(`${this.type}L${this.labelIndex}`);
		this.vmWriter.writeLabel(`${this.type}L${this.labelIndex + 1}`);
		// execute elseStatements
		this.vmWriter.writeLabel(`${this.type}L${this.labelIndex}`);
		this.labelIndex += 2;

		return '';
	}

	compileWhile() {
		let expression = '';
		let statements = '';

		// get while
		if(this.tokenType !== 'keyword' || this.token !== 'while') {
			throw new Error('Expected keyword "while"');
		} else {
			this.getFullToken(); // advance
		}

		// get firstParen, expression, secondParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol (');
		} else {
			this.getFullToken(); // advance
			expression += this.compileExpression();
			this.getFullToken(); // advance
		}

		// get firstBracket, statements, secondBracket
		if(this.tokenType !== 'symbol' || this.token !== '{') {
			throw new Error('Expected symbol {');
		} else {
			this.getFullToken(); // advance
			statements += this.compileStatements(); // DONT FORGET
			this.getFullToken(); // advance
		}

		this.vmWriter.writeLabel(`${this.type}L${this.labelIndex}`);
		this.vmWriter.writeExp(expression, this.symbolTable);
		this.vmWriter.writeUnaryOp('~');
		this.vmWriter.writeIf(`${this.type}L${this.labelIndex + 1}`);
		// writeCompiledStatements?
		this.vmWriter.writeGoTo(`${this.type}L${this.labelIndex}`);
		this.vmWriter.writeLabel(`${this.type}L${this.labelIndex + 1}`);
		this.labelIndex += 2;
		
		return '';
	}

	compileDo() {
		let subRoutineCall = '';
		
		// get do
		if(this.tokenType !== 'keyword' || this.token !== 'do') {
			throw new Error('Expected keyword "do"');
		} else {
			this.getFullToken(); // advance
		}

		// get subroutineCall
		if(this.tokenType !== 'identifier') {
			throw new Error('Expected identifer');
		} else {
			subRoutineCall += this.getToken();
			this.getFullToken(); // advance
			if(this.tokenType === 'symbol' && this.token === '.') {
				subRoutineCall += this.getToken();
				this.getFullToken(); // advance
				if(this.tokenType !== 'identifier') {
					throw new Error('Expected identifer');
				}
				subRoutineCall += this.getToken();
				this.getFullToken(); // advance
			}
		}

		// get leftParen
		if(this.tokenType !== 'symbol' || this.token !== '(') {
			throw new Error('Expected symbol "("');
		} else {
			subRoutineCall += this.getToken();
			this.getFullToken(); // advance
		}

		subRoutineCall += this.compileExpressionList();
		
		// get rightParen
		if(this.tokenType !== 'symbol' || this.token !== ')') {
			throw new Error('Expected symbol ")"');
		} else {
			subRoutineCall += this.getToken();
			this.getFullToken(); // advance
		}

		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			this.getFullToken(); // advance
		}

		this.vmWriter.writeExp(subRoutineCall, this.symbolTable);

		return '';
	}

	compileReturn() {
		let returnStatement = '';

		// get return
		if(this.tokenType !== 'keyword' || this.token !== 'return') {
			throw new Error('Expected keyword "return"');
		} else {
			this.getFullToken(); // advance
		}
		// get expression
		if(this.token !== ';') {
			returnStatement += this.compileExpression();
		}

		if(this.subRoutineType === 'void' && returnStatement !== '') {
			throw new Error(`Expected return type 'void' but received ${returnStatement}`)
		}
		// get semiColon
		if(this.tokenType !== 'symbol' || this.token !== ';') {
			throw new Error('Expected symbol ";"');
		} else {
			this.getFullToken(); // advance
		}

		this.vmWriter.writeReturn(returnStatement, this.subRoutineType, this.symbolTable);

		return '';
	}

	compileTerm() {
		let term = '';

		if( // here
			this.tokenType === 'integerConstant' ||
			this.tokenType === 'stringConstant'  ||
			keywordConstants.has(this.token)
		) {
			term += this.getToken();
			this.getFullToken(); // advance
		} else if(this.tokenType === 'identifier') { // subroutineCall
			term += this.getToken();
			this.getFullToken(); // advance
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
				term += this.getToken();
				this.getFullToken(); // advance
				if(this.tokenType !== 'identifier') {
					throw new Error("Expected identifier");
				}
				term += this.getToken();
				this.getFullToken(); // advance
				if(this.tokenType !== 'symbol' || this.token !== '(') {
					throw new Error("Expected symbol (");
				}
				term += this.getToken();
				this.getFullToken(); // advance
				term += this.compileExpressionList();
				if(this.tokenType !== 'symbol' || this.token !== ')') {
					throw new Error("Expected symbol )");
				}
				term += this.getToken();
				this.getFullToken();
			}
		} else if(this.tokenType === 'symbol' && this.token === '(') { // here
			term += this.getToken();
			this.getFullToken();
			term += this.compileExpression();
			term += this.getToken();
			this.getFullToken();

		} else if(this.tokenType === 'symbol' && unaryOp.has(this.token)) { // here
			term += this.getToken();
			this.getFullToken();
			term += this.compileTerm();
		}

		return term;
		// return formatDec(term, 'term');
	}

	compileExpression() {
		let expression = '';
		
		expression += this.compileTerm();

		while(ops.has(this.token)) {
			expression += this.getToken();
			this.getFullToken();
			expression += this.compileTerm();
		}
		
		return expression;
		// return formatDec(expression, 'expression');
	}

	compileExpressionList() {
		let expressionList = '';

		if(this.token !== ')') {
			expressionList += this.compileExpression();
		}
		
		while(this.getToken() !== ')') {
			expressionList += this.getToken();
			this.getFullToken();
			expressionList += this.compileExpression();
		}
	
		return expressionList;
		// return formatDec(expressionList, 'expressionList');
	}

}

module.exports = CompilationEngine;
