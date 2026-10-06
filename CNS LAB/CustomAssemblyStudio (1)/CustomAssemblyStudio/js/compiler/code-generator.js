/**
 * Custom Assembly Studio - Code Generator
 * Translates AST instructions and resolved symbol addresses into 3-byte machine instructions:
 * [Byte 0: Opcode] [Byte 1: Operand 1 / Reg] [Byte 2: Operand 2 / Reg / Imm / Addr]
 */

export class MachineInstruction {
  constructor(address, bytes, assembly, line, metadata = {}) {
    this.address = address; // numeric address
    this.bytes = bytes; // array of 3 numbers e.g. [0x10, 0x01, 0x0A]
    this.assembly = assembly;
    this.line = line;
    this.metadata = metadata;
  }

  get hexAddress() {
    return '0x' + this.address.toString(16).toUpperCase().padStart(4, '0');
  }

  get hexBytes() {
    return this.bytes.map(b => (b & 0xFF).toString(16).toUpperCase().padStart(2, '0')).join(' ');
  }
}

export class CodeGenerator {
  constructor(ast, symbolTable = []) {
    this.ast = ast;
    this.symbolTable = new Map(symbolTable.map(s => [s.name, s]));
    this.instructions = [];
    this.binaryStream = [];
  }

  generate() {
    this.instructions = [];
    this.binaryStream = [];
    let currentAddress = 0x0000;

    for (const node of this.ast) {
      if (node.type !== 'INSTRUCTION') continue;

      const { opcode, operands, line, rawLine } = node;
      const bytes = this.encodeInstruction(opcode, operands, currentAddress);

      const mInst = new MachineInstruction(
        currentAddress,
        bytes,
        rawLine.trim() || `${opcode} ${operands.map(o => o.raw).join(', ')}`,
        line,
        { opcode, operands }
      );

      this.instructions.push(mInst);
      this.binaryStream.push(...bytes);
      currentAddress += 3;
    }

    return {
      instructions: this.instructions,
      binaryStream: this.binaryStream,
      totalBytes: this.binaryStream.length
    };
  }

  encodeInstruction(opcode, operands, currentAddress) {
    let b0 = 0x00;
    let b1 = 0x00;
    let b2 = 0x00;

    switch (opcode) {
      case 'MOV': {
        const destReg = this.regCode(operands[0]?.value);
        b1 = destReg;
        if (operands[1]?.kind === 'REGISTER') {
          b0 = 0x11;
          b2 = this.regCode(operands[1]?.value);
        } else {
          // Immediate
          b0 = 0x10;
          b2 = this.parseImm(operands[1]);
        }
        break;
      }

      case 'ADD': {
        b0 = 0x20;
        b1 = this.regCode(operands[0]?.value);
        if (operands[1]?.kind === 'REGISTER') {
          b2 = this.regCode(operands[1]?.value);
        } else {
          b2 = this.parseImm(operands[1]);
        }
        break;
      }

      case 'SUB': {
        b1 = this.regCode(operands[0]?.value);
        if (operands[1]?.kind === 'REGISTER') {
          b0 = 0x22;
          b2 = this.regCode(operands[1]?.value);
        } else {
          b0 = 0x21; // Match prompt SUB R2, 5 -> 21 02 05
          b2 = this.parseImm(operands[1]);
        }
        break;
      }

      case 'MUL': {
        b0 = 0x23;
        b1 = this.regCode(operands[0]?.value);
        b2 = operands[1]?.kind === 'REGISTER' ? this.regCode(operands[1]?.value) : this.parseImm(operands[1]);
        break;
      }

      case 'DIV': {
        b0 = 0x24;
        b1 = this.regCode(operands[0]?.value);
        b2 = operands[1]?.kind === 'REGISTER' ? this.regCode(operands[1]?.value) : this.parseImm(operands[1]);
        break;
      }

      case 'AND': {
        b0 = 0x25;
        b1 = this.regCode(operands[0]?.value);
        b2 = operands[1]?.kind === 'REGISTER' ? this.regCode(operands[1]?.value) : this.parseImm(operands[1]);
        break;
      }

      case 'OR': {
        b0 = 0x26;
        b1 = this.regCode(operands[0]?.value);
        b2 = operands[1]?.kind === 'REGISTER' ? this.regCode(operands[1]?.value) : this.parseImm(operands[1]);
        break;
      }

      case 'XOR': {
        b0 = 0x27;
        b1 = this.regCode(operands[0]?.value);
        b2 = operands[1]?.kind === 'REGISTER' ? this.regCode(operands[1]?.value) : this.parseImm(operands[1]);
        break;
      }

      case 'STORE': {
        // STORE R1, 100 -> 30 01 64
        b0 = 0x30;
        b1 = this.regCode(operands[0]?.value);
        b2 = this.parseImm(operands[1]);
        break;
      }

      case 'LOAD': {
        // LOAD R1, 100 -> 31 01 64
        b0 = 0x31;
        b1 = this.regCode(operands[0]?.value);
        b2 = this.parseImm(operands[1]);
        break;
      }

      case 'CMP': {
        b0 = 0x35;
        b1 = this.regCode(operands[0]?.value);
        b2 = operands[1]?.kind === 'REGISTER' ? this.regCode(operands[1]?.value) : this.parseImm(operands[1]);
        break;
      }

      case 'JMP': {
        b0 = 0x40;
        b1 = 0x00;
        b2 = this.resolveTarget(operands[0]);
        break;
      }

      case 'JZ': {
        b0 = 0x41;
        b1 = 0x00;
        b2 = this.resolveTarget(operands[0]);
        break;
      }

      case 'JNZ': {
        b0 = 0x42;
        b1 = 0x00;
        b2 = this.resolveTarget(operands[0]);
        break;
      }

      case 'JC': {
        b0 = 0x43;
        b1 = 0x00;
        b2 = this.resolveTarget(operands[0]);
        break;
      }

      case 'JNC': {
        b0 = 0x44;
        b1 = 0x00;
        b2 = this.resolveTarget(operands[0]);
        break;
      }

      case 'JN': {
        b0 = 0x45;
        b1 = 0x00;
        b2 = this.resolveTarget(operands[0]);
        break;
      }

      case 'HALT': {
        b0 = 0xFF;
        b1 = 0x00;
        b2 = 0x00;
        break;
      }

      case 'NOP': {
        b0 = 0x00;
        b1 = 0x00;
        b2 = 0x00;
        break;
      }

      default:
        b0 = 0x00;
        b1 = 0x00;
        b2 = 0x00;
    }

    return [b0 & 0xFF, b1 & 0xFF, b2 & 0xFF];
  }

  regCode(regStr) {
    if (!regStr) return 0;
    const match = regStr.toUpperCase().match(/^R([0-7])$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    if (regStr.toUpperCase() === 'PC') return 0x0E;
    if (regStr.toUpperCase() === 'SP') return 0x0F;
    return 0;
  }

  parseImm(op) {
    if (!op) return 0;
    if (typeof op.value === 'number') return op.value & 0xFF;
    const n = parseInt(op.value, 10);
    return isNaN(n) ? 0 : (n & 0xFF);
  }

  resolveTarget(op) {
    if (!op) return 0;
    if (op.resolvedAddress !== undefined) return op.resolvedAddress & 0xFF;
    if (this.symbolTable.has(op.value)) {
      return this.symbolTable.get(op.value).address & 0xFF;
    }
    const val = parseInt(op.value, 10);
    return isNaN(val) ? 0 : (val & 0xFF);
  }
}
