/**
 * Custom Assembly Studio - Intermediate Representation (IR) Generator
 * Translates AST into Three-Address Code (TAC) / Quadruples (Opcode, Arg1, Arg2, Result).
 * Provides a canonical intermediate form between the frontend parser and backend code generator.
 */

export class Quadruple {
  constructor(index, op, arg1 = null, arg2 = null, result = null, line = 0, text = '') {
    this.index = index;
    this.op = op;
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.result = result;
    this.line = line;
    this.text = text || this.formatText();
  }

  formatText() {
    const parts = [this.op];
    if (this.arg1 !== null) parts.push(this.formatArg(this.arg1));
    if (this.arg2 !== null) parts.push(this.formatArg(this.arg2));
    if (this.result !== null && this.result !== this.arg1) parts.push(`-> ${this.formatArg(this.result)}`);
    return `(${parts.join(', ')})`;
  }

  formatArg(arg) {
    if (typeof arg === 'number') return `#${arg}`;
    return String(arg);
  }
}

export class IRGenerator {
  constructor(ast, symbolTable = []) {
    this.ast = ast;
    this.symbolTable = new Map(symbolTable.map(s => [s.name, s]));
    this.quadruples = [];
  }

  generate() {
    this.quadruples = [];
    let qIndex = 1;

    for (const node of this.ast) {
      if (node.type !== 'INSTRUCTION') continue;

      const { opcode, operands, line } = node;
      let quad = null;

      switch (opcode) {
        case 'MOV': {
          const dest = operands[0].value;
          const src = operands[1].kind === 'IMMEDIATE' ? `#${operands[1].value}` : operands[1].value;
          quad = new Quadruple(qIndex++, 'MOV', dest, src, dest, line, `(${opcode}, ${dest}, ${src})`);
          break;
        }

        case 'ADD':
        case 'SUB':
        case 'MUL':
        case 'DIV':
        case 'AND':
        case 'OR':
        case 'XOR': {
          const dest = operands[0].value;
          const src = operands[1].kind === 'IMMEDIATE' ? `#${operands[1].value}` : operands[1].value;
          quad = new Quadruple(qIndex++, opcode, dest, src, dest, line, `(${opcode}, ${dest}, ${src})`);
          break;
        }

        case 'LOAD': {
          const dest = operands[0].value;
          const addr = operands[1].value;
          quad = new Quadruple(qIndex++, 'LOAD', dest, `[#${addr}]`, dest, line, `(LOAD, ${dest}, [${addr}])`);
          break;
        }

        case 'STORE': {
          const src = operands[0].value;
          const addr = operands[1].value;
          quad = new Quadruple(qIndex++, 'STORE', src, `[#${addr}]`, `MEM[${addr}]`, line, `(STORE, ${src}, #${addr})`);
          break;
        }

        case 'CMP': {
          const r1 = operands[0].value;
          const r2 = operands[1].kind === 'IMMEDIATE' ? `#${operands[1].value}` : operands[1].value;
          quad = new Quadruple(qIndex++, 'CMP', r1, r2, 'FLAGS', line, `(CMP, ${r1}, ${r2})`);
          break;
        }

        case 'JMP':
        case 'JZ':
        case 'JNZ':
        case 'JC':
        case 'JNC':
        case 'JN': {
          const target = operands[0].value;
          quad = new Quadruple(qIndex++, opcode, target, null, null, line, `(${opcode}, ${target})`);
          break;
        }

        case 'HALT':
        case 'NOP': {
          quad = new Quadruple(qIndex++, opcode, null, null, null, line, `(${opcode})`);
          break;
        }

        default: {
          const args = operands.map(o => o.value).join(', ');
          quad = new Quadruple(qIndex++, opcode, args, null, null, line, `(${opcode}${args ? ', ' + args : ''})`);
          break;
        }
      }

      if (quad) {
        this.quadruples.push(quad);
      }
    }

    return this.quadruples;
  }
}
