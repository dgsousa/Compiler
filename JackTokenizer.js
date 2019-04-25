const keywords = {
	class: 'CLASS',
	method: 'METHOD',
	function: 'FUNCTION',
	constructor: 'CONSTRUCTOR',
	int: 'INT',
	boolean: 'BOOLEAN',
	char: 'CHAR',
	void: 'VOID',
	var: 'VAR',
	static: 'STATIC',
	field: 'FIELD',
	let: 'LET',
	do: 'DO',
	if: 'IF',
	else: 'ELSE',
	while: 'WHILE',
	return: 'RETURN',
	true: 'TRUE',
	false: 'FALSE',
	null: 'NULL',
	this: 'THIS'
}

const symbols = new Set([
	'{', '}', '(', ')', '[', ']', '.', ',', ';', '+', '-', '*', '/', '&', '|', '<', '>', '=', '-','~',
]);

const emptySpace = new Set([
	'', ' ', '\n', '\r', '\t',
])


class JackTokenizer {
	constructor(fileContents) {
		this.fileContents = this.removeComments(fileContents);
		this.currentTokenIndex = 0;
		this.currentToken = '';
		this.tokens = [];
		this.buildTokens();
		return this.tokens;
	}

	removeComments(fileContents) {
		const formattedFileContents = [];
		let isInlineComment = false;
		let isMultiLineComment = false;
		let counter = 0;
		while(counter < fileContents.length - 1) {
			const curr = fileContents[counter];
			const next = fileContents[counter + 1]
			if(curr === '/' && next === '/') {
				isInlineComment = true;
			}
			if(curr === '/' && next === '*') {
				isMultiLineComment = true;
			}
			if(curr === '*' && next === '/') {
				isMultiLineComment = false;
				counter += 2;
			}
			if(curr === '\n') {
				isInlineComment = false;
			}
			if(!isInlineComment && !isMultiLineComment) {
				formattedFileContents.push(fileContents[counter]);
			}
			counter++;
		}
		return formattedFileContents;
	}

	buildTokens() {
		let isQuote = false;
		this.tokens.push('<tokens>');
		while(this.hasMoreTokens()) {
			const currentChar = this.getCurrentChar();
			if(emptySpace.has(currentChar) && !isQuote) { // if current token is whitespace
				if(!emptySpace.has(this.currentToken)) this.processToken();
			} else if(symbols.has(currentChar)) { // if current token is a symbol
				this.processToken();
				this.currentToken += currentChar;
			} else if(currentChar === '"') { //if current token is a quote
				isQuote = !isQuote;
				if(isQuote) {
					this.processToken();
					this.currentToken += currentChar;
				} else {
					this.currentToken += currentChar;
					this.processToken();
				}
			} else { // if current token is alphanumberic
				if(symbols.has(this.currentToken) && !isQuote) {
					this.processToken();
				}
				this.currentToken += currentChar;
				}
			this.advance();
		}
		this.processToken();
		this.tokens.push('</tokens>');
	}

	getCurrentChar() {
		return this.fileContents[this.currentTokenIndex];
	}
    
	processToken() {
		if(!emptySpace.has(this.currentToken)) {
			let token = '';
			const tokenType = this.tokenType();
			if(tokenType === 'KEYWORD') token = this.keyWord();
			if(tokenType === 'SYMBOL') token = this.symbol();
			if(tokenType === 'INT_CONST') token = this.intVal();
			if(tokenType === 'STRING_CONST') token = this.stringVal();
			if(tokenType === 'IDENTIFIER') token = this.identifier();
			this.tokens.push(token);
		}
		this.currentToken = '';
	}

	hasMoreTokens() {
		return this.currentTokenIndex < this.fileContents.length;
	}

	advance() {
		this.currentTokenIndex++;
	}

	tokenType() {
		if(keywords[this.currentToken]) return 'KEYWORD';
		if(symbols.has(this.currentToken)) return 'SYMBOL';
		if(parseInt(this.currentToken) || parseInt(this.currentToken) === 0) return 'INT_CONST';
		if(this.currentToken[0] === '"') return 'STRING_CONST';
		return 'IDENTIFIER';
	}

	keyWord() {
		return `<keyword> ${this.currentToken} </keyword>`;
	}

	symbol() {
		let token = this.currentToken;
		if(this.currentToken === '<') token = '&lt;'; 
		if(this.currentToken === '>') token = '&gt;';
		if(this.currentToken === '&') token = '&amp;';
		return `<symbol> ${token} </symbol>`;
	}

	identifier() {
		return `<identifier> ${this.currentToken} </identifier>`;
	}

	intVal() {
		return `<integerConstant> ${this.currentToken} </integerConstant>`;
	}

	stringVal() {
		const formattedString = this.currentToken.slice(1, this.currentToken.length - 1);
		return `<stringConstant> ${formattedString} </stringConstant>`;
	}

}

module.exports = JackTokenizer;