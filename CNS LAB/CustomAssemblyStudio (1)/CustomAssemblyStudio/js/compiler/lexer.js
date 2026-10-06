/**
 * Custom Assembly Studio - Lexical Analyzer (Lexer)
 * Tokenizes assembly source code with accurate line/column tracking
 * and classifies instructions, registers, numbers, labels, and symbols.
 */

export const TokenType = {
  INSTRUCTION: 'INSTRUCTION',
  REGISTER: 'REGISTER',
  CONSTANT: 'CONSTANT',
  IDENTIFIER: 'IDENTIFIER',
  LABEL_DEF: 'LABEL_DEF',
  DELIMITER: 'DELIMITER',
  DIRECTIVE: 'DIRECTIVE',
  COMMENT: 'COMMENT',
  NEWLINE: 'NEWLINE',
  EOF: 'EOF',
  UNKNOWN: 'UNKNOWN'
};

export const INSTRUCTIONS = [
  'MOV', 'ADD', 'SUB', 'MUL', 'DIV',
  'AND', 'OR', 'XOR', 'NOT',
  'LOAD', 'STORE', 'CMP',
  'JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN',
  'PUSH', 'POP', 'CALL', 'RET',
  'NOP', 'HALT'
];

export const REGISTERS = [
  'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
  'PC', 'SP', 'FLAGS'
];

export class Token {
  constructor(type, value, line, column, raw) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
    this.raw = raw ?? value;
  }
}

export class Lexer {
  constructor(source) {
    this.source = source || '';
    this.tokens = [];
    this.errors = [];
    this.line = 1;
    this.col = 1;
    this.pos = 0;
  }

  tokenize() {
    this.tokens = [];
    this.errors = [];
    this.line = 1;
    this.col = 1;
    this.pos = 0;

    const len = this.source.length;

    while (this.pos < len) {
      const char = this.source[this.pos];

      // Handle newlines
      if (char === '\n') {
        this.tokens.push(new Token(TokenType.NEWLINE, '\n', this.line, this.col, '\\n'));
        this.line++;
        this.col = 1;
        this.pos++;
        continue;
      }

      if (char === '\r') {
        this.pos++;
        continue;
      }

      // Handle whitespace
      if (char === ' ' || char === '\t') {
        this.col++;
        this.pos++;
        continue;
      }

      // Handle Comments: ; or //
      if (char === ';' || (char === '/' && this.pos + 1 < len && this.source[this.pos + 1] === '/')) {
        const startCol = this.col;
        let commentText = '';
        while (this.pos < len && this.source[this.pos] !== '\n') {
          commentText += this.source[this.pos];
          this.pos++;
          this.col++;
        }
        this.tokens.push(new Token(TokenType.COMMENT, commentText.trim(), this.line, startCol, commentText));
        continue;
      }

      // Delimiters: , : [ ] ( )
      if (char === ',' || char === ':' || char === '[' || char === ']') {
        this.tokens.push(new Token(TokenType.DELIMITER, char, this.line, this.col, char));
        this.pos++;
        this.col++;
        continue;
      }

      // Numbers: Hex (0x..), Binary (0b..), or Decimal (123, -5)
      if (this.isDigit(char) || (char === '-' && this.isDigit(this.peekNext()))) {
        const startCol = this.col;
        let numStr = '';
        if (char === '-') {
          numStr += '-';
          this.pos++;
          this.col++;
        }

        if (this.source.substr(this.pos, 2).toLowerCase() === '0x') {
          numStr += this.source.substr(this.pos, 2);
          this.pos += 2;
          this.col += 2;
          while (this.pos < len && /[0-9a-fA-F]/.test(this.source[this.pos])) {
            numStr += this.source[this.pos];
            this.pos++;
            this.col++;
          }
        } else if (this.source.substr(this.pos, 2).toLowerCase() === '0b') {
          numStr += this.source.substr(this.pos, 2);
          this.pos += 2;
          this.col += 2;
          while (this.pos < len && /[01]/.test(this.source[this.pos])) {
            numStr += this.source[this.pos];
            this.pos++;
            this.col++;
          }
        } else {
          while (this.pos < len && /[0-9]/.test(this.source[this.pos])) {
            numStr += this.source[this.pos];
            this.pos++;
            this.col++;
          }
        }

        const parsedVal = this.parseNumber(numStr);
        this.tokens.push(new Token(TokenType.CONSTANT, parsedVal, this.line, startCol, numStr));
        continue;
      }

      // String literal or chars
      if (char === '"' || char === "'") {
        const quote = char;
        const startCol = this.col;
        let strVal = '';
        this.pos++;
        this.col++;
        while (this.pos < len && this.source[this.pos] !== quote && this.source[this.pos] !== '\n') {
          strVal += this.source[this.pos];
          this.pos++;
          this.col++;
        }
        if (this.pos < len && this.source[this.pos] === quote) {
          this.pos++;
          this.col++;
          this.tokens.push(new Token(TokenType.CONSTANT, strVal, this.line, startCol, quote + strVal + quote));
        } else {
          this.errors.push({
            line: this.line,
            col: startCol,
            message: `Unterminated string literal at line ${this.line}`
          });
        }
        continue;
      }

      // Identifiers, Keywords, Registers, Labels
      if (this.isAlpha(char) || char === '.' || char === '_') {
        const startCol = this.col;
        let word = '';
        while (this.pos < len && (this.isAlphaNumeric(this.source[this.pos]) || this.source[this.pos] === '.' || this.source[this.pos] === '_')) {
          word += this.source[this.pos];
          this.pos++;
          this.col++;
        }

        // Check if next char is a colon ':' -> this is a label definition
        if (this.pos < len && this.source[this.pos] === ':') {
          this.tokens.push(new Token(TokenType.LABEL_DEF, word, this.line, startCol, word + ':'));
          this.pos++; // skip ':'
          this.col++;
          continue;
        }

        const upper = word.toUpperCase();
        if (INSTRUCTIONS.includes(upper)) {
          this.tokens.push(new Token(TokenType.INSTRUCTION, upper, this.line, startCol, word));
        } else if (REGISTERS.includes(upper)) {
          this.tokens.push(new Token(TokenType.REGISTER, upper, this.line, startCol, word));
        } else if (word.startsWith('.')) {
          this.tokens.push(new Token(TokenType.DIRECTIVE, upper, this.line, startCol, word));
        } else {
          this.tokens.push(new Token(TokenType.IDENTIFIER, word, this.line, startCol, word));
        }
        continue;
      }

      // Unknown character
      this.errors.push({
        line: this.line,
        col: this.col,
        message: `Unexpected character '${char}' at line ${this.line}, column ${this.col}`
      });
      this.tokens.push(new Token(TokenType.UNKNOWN, char, this.line, this.col, char));
      this.pos++;
      this.col++;
    }

    this.tokens.push(new Token(TokenType.EOF, '', this.line, this.col, ''));
    return {
      tokens: this.tokens,
      errors: this.errors
    };
  }

  isDigit(c) {
    return c >= '0' && c <= '9';
  }

  isAlpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  }

  isAlphaNumeric(c) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  peekNext() {
    return this.pos + 1 < this.source.length ? this.source[this.pos + 1] : '';
  }

  parseNumber(str) {
    if (!str) return 0;
    if (str.startsWith('0x') || str.startsWith('0X')) {
      return parseInt(str, 16);
    }
    if (str.startsWith('0b') || str.startsWith('0B')) {
      return parseInt(str.substring(2), 2);
    }
    return parseInt(str, 10);
  }
}
