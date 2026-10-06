/**
 * Custom Assembly Studio - Syntax Analyzer (Parser)
 * Constructs an Abstract Syntax Tree (AST) from token streams,
 * validates instruction formats, operands, delimiters, and generates syntax diagnostics.
 */

import { TokenType } from './lexer.js';

export class ASTNode {
  constructor(type, line) {
    this.type = type;
    this.line = line;
  }
}

export class InstructionNode extends ASTNode {
  constructor(line, opcode, operands = [], rawLine = '') {
    super('INSTRUCTION', line);
    this.opcode = opcode;
    this.operands = operands;
    this.rawLine = rawLine;
  }
}

export class LabelNode extends ASTNode {
  constructor(line, name) {
    super('LABEL', line);
    this.name = name;
  }
}

export class DirectiveNode extends ASTNode {
  constructor(line, directive, value) {
    super('DIRECTIVE', line);
    this.directive = directive;
    this.value = value;
  }
}

export class Operand {
  constructor(kind, value, raw) {
    this.kind = kind; // 'REGISTER', 'IMMEDIATE', 'ADDRESS', 'LABEL'
    this.value = value;
    this.raw = raw;
  }
}

export class Parser {
  constructor(tokens, rawLines = []) {
    this.tokens = tokens;
    this.rawLines = rawLines;
    this.pos = 0;
    this.ast = [];
    this.errors = [];
    this.warnings = [];
  }

  parse() {
    this.ast = [];
    this.errors = [];
    this.warnings = [];
    this.pos = 0;

    while (!this.isAtEnd()) {
      // Skip empty lines or comments
      if (this.match(TokenType.NEWLINE) || this.match(TokenType.COMMENT)) {
        continue;
      }

      try {
        const stmt = this.parseStatement();
        if (stmt) {
          if (Array.isArray(stmt)) {
            this.ast.push(...stmt);
          } else {
            this.ast.push(stmt);
          }
        }
      } catch (err) {
        this.errors.push({
          line: this.peek()?.line || 1,
          message: err.message,
          expected: err.expected || '',
          found: err.found || ''
        });
        this.synchronize();
      }
    }

    return {
      ast: this.ast,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  parseStatement() {
    const token = this.peek();

    // 1. Label Definition: "LABEL:"
    if (token.type === TokenType.LABEL_DEF) {
      const labelToken = this.advance();
      const nodes = [new LabelNode(labelToken.line, labelToken.value)];

      // A line can have both a label and an instruction: "LOOP: MOV R1, 10"
      if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.EOF) && !this.check(TokenType.COMMENT)) {
        const nextStmt = this.parseStatement();
        if (nextStmt) {
          if (Array.isArray(nextStmt)) nodes.push(...nextStmt);
          else nodes.push(nextStmt);
        }
      }
      return nodes;
    }

    // 2. Directive: ".ORG 0x100"
    if (token.type === TokenType.DIRECTIVE) {
      const dirToken = this.advance();
      let val = null;
      if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.EOF)) {
        val = this.advance().value;
      }
      this.consumeEndStatement();
      return new DirectiveNode(dirToken.line, dirToken.value, val);
    }

    // 3. Instruction: "MOV R1, 10"
    if (token.type === TokenType.INSTRUCTION) {
      return this.parseInstruction();
    }

    // Unexpected token
    const errToken = this.advance();
    const error = new Error(`Unexpected token '${errToken.raw}'`);
    error.expected = 'Instruction or Label';
    error.found = `${errToken.raw}`;
    throw error;
  }

  parseInstruction() {
    const instToken = this.advance();
    const opcode = instToken.value.toUpperCase();
    const line = instToken.line;
    const operands = [];

    const rawLine = this.rawLines[line - 1] || `${opcode}`;

    // Instructions with NO operands: HALT, NOP, RET
    if (['HALT', 'NOP', 'RET'].includes(opcode)) {
      this.consumeEndStatement();
      return new InstructionNode(line, opcode, operands, rawLine);
    }

    // 1st operand
    if (this.check(TokenType.NEWLINE) || this.check(TokenType.EOF) || this.check(TokenType.COMMENT)) {
      const err = new Error(`Instruction '${opcode}' requires operands`);
      err.expected = this.getExpectedSignature(opcode);
      err.found = `${opcode}`;
      throw err;
    }

    operands.push(this.parseOperand(opcode, 0));

    // Instructions with 1 operand: JMP, JZ, JNZ, JC, JNC, JN, PUSH, POP, NOT, CALL
    if (['JMP', 'JZ', 'JNZ', 'JC', 'JNC', 'JN', 'PUSH', 'POP', 'NOT', 'CALL'].includes(opcode)) {
      this.consumeEndStatement();
      return new InstructionNode(line, opcode, operands, rawLine);
    }

    // Instructions with 2 operands require a delimiter ','
    if (!this.matchDelimiter(',')) {
      const err = new Error(`Expected ',' separating operands in '${opcode}' instruction`);
      err.expected = `${opcode} <op1>, <op2>`;
      err.found = `${rawLine.trim()}`;
      throw err;
    }

    // 2nd operand
    if (this.check(TokenType.NEWLINE) || this.check(TokenType.EOF) || this.check(TokenType.COMMENT)) {
      const err = new Error(`Missing second operand for '${opcode}'`);
      err.expected = this.getExpectedSignature(opcode);
      err.found = `${rawLine.trim()}`;
      throw err;
    }

    operands.push(this.parseOperand(opcode, 1));

    this.consumeEndStatement();
    return new InstructionNode(line, opcode, operands, rawLine);
  }

  parseOperand(opcode, opIndex) {
    // Check for memory bracket syntax: [100] or [R1]
    if (this.matchDelimiter('[')) {
      const innerToken = this.advance();
      if (!this.matchDelimiter(']')) {
        const err = new Error(`Missing closing bracket ']' in memory address operand`);
        err.expected = `[address]`;
        err.found = `[${innerToken.raw}`;
        throw err;
      }
      if (innerToken.type === TokenType.REGISTER) {
        return new Operand('REGISTER_INDIRECT', innerToken.value, `[${innerToken.value}]`);
      } else if (innerToken.type === TokenType.CONSTANT) {
        return new Operand('ADDRESS', innerToken.value, `[${innerToken.raw}]`);
      } else {
        return new Operand('ADDRESS', innerToken.value, `[${innerToken.raw}]`);
      }
    }

    const token = this.advance();

    if (token.type === TokenType.REGISTER) {
      return new Operand('REGISTER', token.value, token.raw);
    }

    if (token.type === TokenType.CONSTANT) {
      // If opcode is LOAD or STORE and operand is an address:
      if ((opcode === 'LOAD' && opIndex === 1) || (opcode === 'STORE' && opIndex === 1)) {
        return new Operand('ADDRESS', token.value, token.raw);
      }
      return new Operand('IMMEDIATE', token.value, token.raw);
    }

    if (token.type === TokenType.IDENTIFIER) {
      return new Operand('LABEL', token.value, token.raw);
    }

    const err = new Error(`Invalid operand '${token.raw}'`);
    err.expected = 'Register, Constant or Label';
    err.found = token.raw;
    throw err;
  }

  getExpectedSignature(opcode) {
    const signatures = {
      'MOV': 'MOV <REGISTER>, <REGISTER | CONSTANT>',
      'ADD': 'ADD <DEST_REG>, <SRC_REG>',
      'SUB': 'SUB <DEST_REG>, <SRC_REG | CONSTANT>',
      'MUL': 'MUL <DEST_REG>, <SRC_REG>',
      'DIV': 'DIV <DEST_REG>, <SRC_REG>',
      'AND': 'AND <DEST_REG>, <SRC_REG>',
      'OR': 'OR <DEST_REG>, <SRC_REG>',
      'XOR': 'XOR <DEST_REG>, <SRC_REG>',
      'LOAD': 'LOAD <DEST_REG>, <ADDRESS>',
      'STORE': 'STORE <SRC_REG>, <ADDRESS>',
      'CMP': 'CMP <REG_A>, <REG_B>',
      'JMP': 'JMP <LABEL>',
      'JZ': 'JZ <LABEL>',
      'JNZ': 'JNZ <LABEL>',
      'HALT': 'HALT',
      'NOP': 'NOP'
    };
    return signatures[opcode] || `${opcode} ...`;
  }

  consumeEndStatement() {
    if (this.match(TokenType.COMMENT)) {
      // allow comment at end of line
    }
    if (this.match(TokenType.NEWLINE) || this.isAtEnd()) {
      return;
    }
    // If not end of statement, skip to next line
  }

  synchronize() {
    while (!this.isAtEnd()) {
      if (this.peek().type === TokenType.NEWLINE) {
        this.advance();
        return;
      }
      this.advance();
    }
  }

  match(type) {
    if (this.check(type)) {
      this.advance();
      return true;
    }
    return false;
  }

  matchDelimiter(delim) {
    if (this.check(TokenType.DELIMITER) && this.peek().value === delim) {
      this.advance();
      return true;
    }
    return false;
  }

  check(type) {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  peek() {
    return this.tokens[this.pos];
  }

  advance() {
    if (!this.isAtEnd()) this.pos++;
    return this.tokens[this.pos - 1];
  }

  isAtEnd() {
    return this.pos >= this.tokens.length || this.tokens[this.pos].type === TokenType.EOF;
  }
}
