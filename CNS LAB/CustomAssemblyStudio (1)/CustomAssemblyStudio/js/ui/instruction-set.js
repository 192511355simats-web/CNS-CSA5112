/**
 * Custom Assembly Studio - Instruction Set Architecture (ISA) Reference Explorer
 * Searchable reference manual covering MOV, ADD, SUB, MUL, DIV, AND, OR, XOR,
 * LOAD, STORE, CMP, JMP, JZ, JNZ, and HALT with syntax, machine opcodes, and 1-click insert.
 */

export const ISA_DEFINITIONS = [
  {
    name: 'MOV',
    category: 'Data Transfer',
    syntax: 'MOV Rd, <Rs | imm>',
    opcode: '0x10 (imm) / 0x11 (reg)',
    cycles: 1,
    description: 'Copies an immediate constant value or the contents of a source register into the destination register.',
    operands: 'Rd: Destination Register (R0-R7), Rs: Source Register (R0-R7) or Immediate value (0-255)',
    example: 'MOV R1, 10\nMOV R2, R1'
  },
  {
    name: 'ADD',
    category: 'Arithmetic',
    syntax: 'ADD Rd, <Rs | imm>',
    opcode: '0x20',
    cycles: 1,
    description: 'Adds the source register value to the destination register and updates Z, C, N, and O condition flags.',
    operands: 'Rd: Destination Register (R0-R7), Rs: Source Register (R0-R7)',
    example: 'ADD R1, R2'
  },
  {
    name: 'SUB',
    category: 'Arithmetic',
    syntax: 'SUB Rd, <Rs | imm>',
    opcode: '0x21 (imm) / 0x22 (reg)',
    cycles: 1,
    description: 'Subtracts the source value from the destination register and stores the difference in Rd.',
    operands: 'Rd: Destination Register (R0-R7), Rs: Source Register or Immediate (0-255)',
    example: 'SUB R2, 5'
  },
  {
    name: 'MUL',
    category: 'Arithmetic',
    syntax: 'MUL Rd, Rs',
    opcode: '0x23',
    cycles: 2,
    description: 'Multiplies the destination register by the source register and stores the lower word result in Rd.',
    operands: 'Rd: Destination Register (R0-R7), Rs: Source Register (R0-R7)',
    example: 'MUL R2, R1'
  },
  {
    name: 'DIV',
    category: 'Arithmetic',
    syntax: 'DIV Rd, Rs',
    opcode: '0x24',
    cycles: 3,
    description: 'Divides the destination register by the source register. Sets Overflow flag (O) if division by zero occurs.',
    operands: 'Rd: Dividend / Destination (R0-R7), Rs: Divisor / Source (R0-R7)',
    example: 'DIV R3, R2'
  },
  {
    name: 'AND',
    category: 'Logic',
    syntax: 'AND Rd, Rs',
    opcode: '0x25',
    cycles: 1,
    description: 'Performs bitwise logical AND between destination and source registers.',
    operands: 'Rd: Destination Register (R0-R7), Rs: Source Register (R0-R7)',
    example: 'AND R1, R2'
  },
  {
    name: 'OR',
    category: 'Logic',
    syntax: 'OR Rd, Rs',
    opcode: '0x26',
    cycles: 1,
    description: 'Performs bitwise logical OR between destination and source registers.',
    operands: 'Rd: Destination Register (R0-R7), Rs: Source Register (R0-R7)',
    example: 'OR R3, R4'
  },
  {
    name: 'XOR',
    category: 'Logic',
    syntax: 'XOR Rd, Rs',
    opcode: '0x27',
    cycles: 1,
    description: 'Performs bitwise logical exclusive OR between destination and source registers.',
    operands: 'Rd: Destination Register (R0-R7), Rs: Source Register (R0-R7)',
    example: 'XOR R1, R1  ; Clears R1 to 0'
  },
  {
    name: 'LOAD',
    category: 'Memory',
    syntax: 'LOAD Rd, <address>',
    opcode: '0x31',
    cycles: 2,
    description: 'Reads a byte from the specified memory address (0-255) into destination register Rd.',
    operands: 'Rd: Destination Register (R0-R7), address: RAM address (0x00 - 0xFF)',
    example: 'LOAD R3, 100'
  },
  {
    name: 'STORE',
    category: 'Memory',
    syntax: 'STORE Rs, <address>',
    opcode: '0x30',
    cycles: 2,
    description: 'Writes the contents of source register Rs into the specified memory address (0-255).',
    operands: 'Rs: Source Register (R0-R7), address: RAM address (0x00 - 0xFF)',
    example: 'STORE R1, 100'
  },
  {
    name: 'CMP',
    category: 'Arithmetic',
    syntax: 'CMP Rd, <Rs | imm>',
    opcode: '0x35',
    cycles: 1,
    description: 'Compares two operands by computing (Rd - Rs) without modifying registers. Sets Z, N, C, and O flags.',
    operands: 'Rd: Register A (R0-R7), Rs: Register B or Immediate value',
    example: 'CMP R1, 0'
  },
  {
    name: 'JMP',
    category: 'Control Flow',
    syntax: 'JMP <label | address>',
    opcode: '0x40',
    cycles: 1,
    description: 'Unconditional jump to the designated label address. Updates Program Counter (PC).',
    operands: 'label: Target symbolic label name or direct memory address',
    example: 'JMP END'
  },
  {
    name: 'JZ',
    category: 'Control Flow',
    syntax: 'JZ <label | address>',
    opcode: '0x41',
    cycles: 1,
    description: 'Jump if Zero (equal): branches to the target address if the Zero flag (Z) is set to 1.',
    operands: 'label: Target symbolic label name or address',
    example: 'JZ LOOP_DONE'
  },
  {
    name: 'JNZ',
    category: 'Control Flow',
    syntax: 'JNZ <label | address>',
    opcode: '0x42',
    cycles: 1,
    description: 'Jump if Not Zero (not equal): branches to the target address if the Zero flag (Z) is 0.',
    operands: 'label: Target symbolic label name or address',
    example: 'JNZ FIB_LOOP'
  },
  {
    name: 'HALT',
    category: 'System',
    syntax: 'HALT',
    opcode: '0xFF 00 00',
    cycles: 1,
    description: 'Terminates execution and places the virtual CPU in the HALTED state.',
    operands: 'None',
    example: 'HALT'
  }
];

export class InstructionSetView {
  constructor(container, options = {}) {
    this.container = container;
    this.onInsertCode = options.onInsertCode || (() => {});
    this.searchQuery = '';
    this.selectedCategory = 'All';

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="isa-page-container">
        <div class="isa-header-box">
          <div class="isa-title-row">
            <div>
              <h2 class="isa-heading">Instruction Set Architecture (ISA) Reference</h2>
              <p class="isa-subheading">Complete reference manual for the Custom Assembly Studio 16-bit / 8-bit architecture.</p>
            </div>
            <div class="isa-search-wrapper">
              <input type="text" class="isa-search-input" id="isa-search-input" placeholder="Search instructions (e.g. ADD, MOV, memory)..." />
            </div>
          </div>
          <div class="isa-categories-bar" id="isa-categories-bar">
            <button class="cat-pill active" data-cat="All">All Instructions (${ISA_DEFINITIONS.length})</button>
            <button class="cat-pill" data-cat="Arithmetic">Arithmetic</button>
            <button class="cat-pill" data-cat="Logic">Logic</button>
            <button class="cat-pill" data-cat="Data Transfer">Data Transfer</button>
            <button class="cat-pill" data-cat="Memory">Memory</button>
            <button class="cat-pill" data-cat="Control Flow">Control Flow</button>
            <button class="cat-pill" data-cat="System">System</button>
          </div>
        </div>

        <div class="isa-cards-grid" id="isa-cards-grid"></div>
      </div>
    `;

    this.cardsGrid = this.container.querySelector('#isa-cards-grid');
    this.searchInput = this.container.querySelector('#isa-search-input');

    this.attachEvents();
    this.filterAndRenderCards();
  }

  attachEvents() {
    this.searchInput.addEventListener('input', () => {
      this.searchQuery = this.searchInput.value.toLowerCase().trim();
      this.filterAndRenderCards();
    });

    this.container.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.container.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedCategory = pill.dataset.cat;
        this.filterAndRenderCards();
      });
    });
  }

  filterAndRenderCards() {
    const filtered = ISA_DEFINITIONS.filter(item => {
      const matchCat = this.selectedCategory === 'All' || item.category === this.selectedCategory;
      const matchSearch = !this.searchQuery ||
        item.name.toLowerCase().includes(this.searchQuery) ||
        item.description.toLowerCase().includes(this.searchQuery) ||
        item.syntax.toLowerCase().includes(this.searchQuery);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      this.cardsGrid.innerHTML = `<div class="empty-state-muted">No instructions match your search criteria.</div>`;
      return;
    }

    this.cardsGrid.innerHTML = filtered.map(item => `
      <div class="isa-card">
        <div class="isa-card-top">
          <div class="isa-badge-group">
            <span class="isa-inst-name">${item.name}</span>
            <span class="badge badge-subtle">${item.category}</span>
          </div>
          <div class="isa-opcode-tag">Opcode: <code>${item.opcode}</code></div>
        </div>

        <div class="isa-card-syntax">
          <span class="syntax-label">Syntax:</span>
          <code class="syntax-code">${item.syntax}</code>
        </div>

        <div class="isa-card-desc">${item.description}</div>

        <div class="isa-card-operands">
          <span class="op-subhead">Operands:</span>
          <div class="op-detail-text">${item.operands}</div>
        </div>

        <div class="isa-card-example-row">
          <div class="example-box">
            <span class="ex-label">Example:</span>
            <pre class="ex-code">${item.example}</pre>
          </div>
          <button class="btn btn-xs btn-outline btn-insert-isa" data-example="${encodeURIComponent(item.example)}">
            + Insert
          </button>
        </div>
      </div>
    `).join('');

    this.cardsGrid.querySelectorAll('.btn-insert-isa').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ex = decodeURIComponent(btn.dataset.example);
        this.onInsertCode(ex);
        btn.textContent = '✓ Inserted';
        setTimeout(() => { btn.textContent = '+ Insert'; }, 1500);
      });
    });
  }
}
