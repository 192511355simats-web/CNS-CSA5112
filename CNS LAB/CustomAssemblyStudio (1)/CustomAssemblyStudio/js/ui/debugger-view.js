/**
 * Custom Assembly Studio - Dedicated Debugger View
 * Provides step-by-step debugging, active instruction pointer,
 * breakpoint manager, cycle-by-cycle register diffs, and execution trace logs.
 */

export class DebuggerView {
  constructor(container, simulator, cpu) {
    this.container = container;
    this.simulator = simulator;
    this.cpu = cpu;

    this.render();

    this.cpu.subscribe(() => this.update());
    this.simulator.subscribe(() => this.update());
  }

  render() {
    this.container.innerHTML = `
      <div class="debugger-page-container">
        <div class="debugger-header">
          <div>
            <h2 class="deb-heading">Cycle-Accurate Processor Debugger</h2>
            <p class="deb-subheading">Step execution, breakpoints, register diff analysis, and execution trace.</p>
          </div>
          <div class="deb-controls-bar">
            <button class="btn btn-ctrl btn-run" id="deb-btn-run">▶ Run</button>
            <button class="btn btn-ctrl btn-step" id="deb-btn-step">⏭ Step</button>
            <button class="btn btn-ctrl btn-pause" id="deb-btn-pause">⏸ Pause</button>
            <button class="btn btn-ctrl btn-stop" id="deb-btn-stop">⏹ Stop</button>
            <button class="btn btn-ctrl btn-reset" id="deb-btn-reset">↻ Reset</button>
          </div>
        </div>

        <div class="debugger-status-ribbon">
          <div class="deb-stat-item">
            <span class="deb-stat-label">Current Instruction</span>
            <div class="deb-stat-val text-cyan" id="deb-curr-inst">NOP</div>
          </div>
          <div class="deb-stat-item">
            <span class="deb-stat-label">Program Counter</span>
            <div class="deb-stat-val" id="deb-curr-pc">0x0000</div>
          </div>
          <div class="deb-stat-item">
            <span class="deb-stat-label">Cycle Count</span>
            <div class="deb-stat-val text-indigo" id="deb-curr-cycle">00</div>
          </div>
          <div class="deb-stat-item">
            <span class="deb-stat-label">Execution Status</span>
            <div class="deb-stat-val" id="deb-curr-status">READY</div>
          </div>
        </div>

        <div class="debugger-split-grid">
          <!-- Disassembly Trace List -->
          <div class="dash-card">
            <div class="card-header-clean">
              <span class="card-title-strong">DISASSEMBLY & BREAKPOINTS</span>
              <span class="card-badge-muted">Click row to toggle breakpoint</span>
            </div>
            <div class="disasm-scroll-box" id="deb-disasm-list"></div>
          </div>

          <!-- Right Column: Register Diffs & Execution Log -->
          <div class="deb-right-col">
            <!-- Register Diffs -->
            <div class="dash-card">
              <div class="card-header-clean">
                <span class="card-title-strong">REGISTER STATE & DIFFS</span>
              </div>
              <div class="reg-diffs-grid" id="deb-reg-diffs"></div>
            </div>

            <!-- Execution Log -->
            <div class="dash-card">
              <div class="card-header-clean">
                <span class="card-title-strong">EXECUTION LOG</span>
              </div>
              <div class="exec-log-scroll-box deb-log-box" id="deb-log-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
    this.update();
  }

  attachEvents() {
    this.container.querySelector('#deb-btn-run')?.addEventListener('click', () => this.simulator.run());
    this.container.querySelector('#deb-btn-step')?.addEventListener('click', () => this.simulator.step());
    this.container.querySelector('#deb-btn-pause')?.addEventListener('click', () => this.simulator.pause());
    this.container.querySelector('#deb-btn-stop')?.addEventListener('click', () => this.simulator.stop());
    this.container.querySelector('#deb-btn-reset')?.addEventListener('click', () => this.simulator.reset());
  }

  update() {
    const instEl = this.container.querySelector('#deb-curr-inst');
    const pcEl = this.container.querySelector('#deb-curr-pc');
    const cycleEl = this.container.querySelector('#deb-curr-cycle');
    const statusEl = this.container.querySelector('#deb-curr-status');

    if (instEl) instEl.textContent = this.cpu.IR || 'NOP';
    if (pcEl) pcEl.textContent = '0x' + this.cpu.PC.toString(16).toUpperCase().padStart(4, '0');
    if (cycleEl) cycleEl.textContent = this.cpu.cycleCount.toString().padStart(2, '0');
    if (statusEl) {
      statusEl.textContent = this.cpu.status;
      statusEl.className = `deb-stat-val text-${this.cpu.status === 'RUNNING' ? 'cyan' : this.cpu.status === 'HALTED' ? 'amber' : 'indigo'}`;
    }

    this.renderDisassembly();
    this.renderRegisterDiffs();
    this.renderExecutionLog();
  }

  renderDisassembly() {
    const listContainer = this.container.querySelector('#deb-disasm-list');
    if (!listContainer) return;

    const insts = Array.from(this.cpu.instructionMap.values());
    if (insts.length === 0) {
      listContainer.innerHTML = '<div class="empty-state-muted">No instructions loaded in CPU memory.</div>';
      return;
    }

    listContainer.innerHTML = insts.map((inst, idx) => {
      const isExecuting = (this.cpu.PC === inst.address);
      const isBp = this.simulator.breakpoints.has(inst.address);
      return `
        <div class="disasm-row ${isExecuting ? 'executing' : ''} ${isBp ? 'has-bp' : ''}" data-addr="${inst.address}">
          <span class="disasm-bp-icon" title="Toggle Breakpoint">${isBp ? '🔴' : '⚪'}</span>
          <span class="disasm-line-num">${(idx + 1).toString().padStart(2, '0')}</span>
          <span class="disasm-addr">${inst.hexAddress}</span>
          <span class="disasm-bytes"><code>${inst.hexBytes}</code></span>
          <span class="disasm-text">${inst.assembly}</span>
          ${isExecuting ? '<span class="exec-pointer-tag">← EXECUTING</span>' : ''}
        </div>
      `;
    }).join('');

    listContainer.querySelectorAll('.disasm-row').forEach(row => {
      row.addEventListener('click', () => {
        const addr = parseInt(row.dataset.addr, 10);
        this.simulator.toggleBreakpoint(addr);
        this.renderDisassembly();
      });
    });

    const activeRow = listContainer.querySelector('.disasm-row.executing');
    if (activeRow) {
      activeRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderRegisterDiffs() {
    const container = this.container.querySelector('#deb-reg-diffs');
    if (!container) return;

    let itemsHtml = '';
    for (let i = 0; i < 8; i++) {
      const curr = this.cpu.registers[i];
      const prev = this.cpu.prevRegisters[i];
      const changed = this.cpu.changedRegisters.has(i);

      itemsHtml += `
        <div class="diff-card ${changed ? 'changed' : ''}">
          <span class="diff-reg-name">R${i}</span>
          <div class="diff-val-wrap">
            <span class="diff-curr">0x${curr.toString(16).toUpperCase().padStart(4, '0')}</span>
            ${changed ? `<span class="diff-prev">was 0x${prev.toString(16).toUpperCase().padStart(4, '0')}</span>` : ''}
          </div>
        </div>
      `;
    }

    container.innerHTML = itemsHtml;
  }

  renderExecutionLog() {
    const logBox = this.container.querySelector('#deb-log-container');
    if (!logBox) return;

    if (this.simulator.executionLog.length === 0) {
      logBox.innerHTML = '<div class="empty-state-muted">No execution trace recorded.</div>';
      return;
    }

    logBox.innerHTML = this.simulator.executionLog.map(item => `
      <div class="log-item-row">
        <span class="log-time">${item.time}</span>
        <span class="log-text">${item.text}</span>
      </div>
    `).join('');
  }
}
