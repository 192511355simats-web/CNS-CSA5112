/**
 * Custom Assembly Studio - Workbench Panels Component
 * Handles Machine Code Table, Compiler Pipeline interactive widget with IR quadruples,
 * and Execution Control with cycle log.
 */

export class WorkbenchPipeline {
  constructor(options = {}) {
    this.containerMachineCode = options.containerMachineCode;
    this.containerPipeline = options.containerPipeline;
    this.containerExecution = options.containerExecution;
    this.simulator = options.simulator;
    this.cpu = options.cpu;

    this.activeStage = 'intermediate'; // active clicked stage
    this.lastCompileResult = null;

    this.renderMachineCodePanel();
    this.renderPipelinePanel();
    this.renderExecutionPanel();

    this.cpu.subscribe(() => {
      this.updateMachineCodeHighlight();
      this.updateExecutionStatus();
    });

    this.simulator.subscribe(() => {
      this.updateExecutionStatus();
      this.updateExecutionLog();
    });
  }

  setCompileResult(result) {
    this.lastCompileResult = result;
    this.updateMachineCodeTable();
    this.updatePipelineStages();
  }

  // --- MACHINE CODE PANEL ---
  renderMachineCodePanel() {
    if (!this.containerMachineCode) return;
    this.containerMachineCode.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">MACHINE CODE</span>
        <div class="panel-header-tools">
          <button class="btn-copy-sm" id="btn-copy-machine-code" title="Copy Machine Code Hex">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy
          </button>
        </div>
      </div>
      <div class="machine-code-scroll-box">
        <table class="machine-code-table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Machine Code (Hex)</th>
              <th>Instruction</th>
            </tr>
          </thead>
          <tbody id="machine-code-tbody">
            <tr><td colspan="3" class="text-muted-center">No compiled machine code. Click Compile.</td></tr>
          </tbody>
        </table>
      </div>
    `;

    this.containerMachineCode.querySelector('#btn-copy-machine-code')?.addEventListener('click', () => {
      if (!this.lastCompileResult || !this.lastCompileResult.codeGen) return;
      const hexText = this.lastCompileResult.codeGen.instructions
        .map(i => `${i.hexAddress}  ${i.hexBytes.padEnd(9, ' ')}  ${i.assembly}`)
        .join('\n');
      navigator.clipboard.writeText(hexText).then(() => {
        const btn = this.containerMachineCode.querySelector('#btn-copy-machine-code');
        btn.innerHTML = '✓ Copied!';
        setTimeout(() => {
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy`;
        }, 1500);
      });
    });
  }

  updateMachineCodeTable() {
    const tbody = this.containerMachineCode?.querySelector('#machine-code-tbody');
    if (!tbody) return;

    if (!this.lastCompileResult || !this.lastCompileResult.codeGen || this.lastCompileResult.codeGen.instructions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" class="text-muted-center">Compilation produced no instructions.</td></tr>`;
      return;
    }

    const instructions = this.lastCompileResult.codeGen.instructions;
    tbody.innerHTML = instructions.map(inst => `
      <tr id="mc-row-${inst.address}" class="${this.cpu.PC === inst.address ? 'active-mc-row' : ''}">
        <td class="mc-addr-cell">${inst.hexAddress}</td>
        <td class="mc-bytes-cell"><code>${inst.hexBytes}</code></td>
        <td class="mc-asm-cell">${inst.assembly}</td>
      </tr>
    `).join('');
  }

  updateMachineCodeHighlight() {
    if (!this.containerMachineCode) return;
    const tbody = this.containerMachineCode.querySelector('#machine-code-tbody');
    if (!tbody) return;

    tbody.querySelectorAll('tr').forEach(tr => tr.classList.remove('active-mc-row'));
    const targetRow = tbody.querySelector(`#mc-row-${this.cpu.PC}`);
    if (targetRow) {
      targetRow.classList.add('active-mc-row');
      targetRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // --- COMPILER PIPELINE PANEL ---
  renderPipelinePanel() {
    if (!this.containerPipeline) return;
    this.containerPipeline.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">COMPILER PIPELINE</span>
      </div>
      <div class="pipeline-chain-container" id="pipeline-chain-box">
        <div class="pipeline-node-chip active" data-stage="source">
          <span class="pipe-icon">📄</span>
          <span class="pipe-name">Source Code</span>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipeline-node-chip" data-stage="lexical">
          <span class="pipe-name">Lexical Analyzer</span>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipeline-node-chip" data-stage="syntax">
          <span class="pipe-name">Syntax Analyzer</span>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipeline-node-chip" data-stage="semantic">
          <span class="pipe-name">Semantic Analyzer</span>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipeline-node-chip" data-stage="intermediate">
          <span class="pipe-name">Intermediate Code</span>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipeline-node-chip" data-stage="codegen">
          <span class="pipe-name">Code Generator</span>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipeline-node-chip" data-stage="machine">
          <span class="pipe-name">Machine Code</span>
        </div>
      </div>

      <div class="pipeline-details-split">
        <div class="pipe-details-box">
          <div class="pipe-box-title" id="pipe-details-title">DETAILS</div>
          <div class="pipe-box-content" id="pipe-details-content">
            <div class="line-detail-sample">
              <span class="detail-line-lead">Line 04: ADD R1, R2</span>
              <ul class="detail-bullet-list">
                <li><span class="text-success">✓</span> Instruction 'ADD' recognized</li>
                <li><span class="text-success">✓</span> Register R1 is valid destination</li>
                <li><span class="text-success">✓</span> Register R2 is valid source</li>
                <li><span class="text-success">✓</span> Operand combination is valid</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="pipe-ir-box">
          <div class="pipe-box-title">INTERMEDIATE REPRESENTATION</div>
          <div class="pipe-box-content" id="pipe-ir-content">
            <div class="ir-quad-list" id="ir-quad-list">
              <div>1: (MOV, R1, #10)</div>
              <div>2: (MOV, R2, #20)</div>
              <div>3: (ADD, R1, R2)</div>
              <div>4: (STORE, R1, #100)</div>
              <div>5: (SUB, R2, #5)</div>
              <div>6: (JMP, END)</div>
              <div>7: (HALT)</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachPipelineEvents();
  }

  attachPipelineEvents() {
    const chips = this.containerPipeline.querySelectorAll('.pipeline-node-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeStage = chip.dataset.stage;
        this.updatePipelineDetails();
      });
    });
  }

  updatePipelineStages() {
    this.updatePipelineDetails();
    this.updateIRList();
  }

  updateIRList() {
    const irBox = this.containerPipeline?.querySelector('#ir-quad-list');
    if (!irBox || !this.lastCompileResult) return;

    if (!this.lastCompileResult.ir || this.lastCompileResult.ir.length === 0) {
      irBox.innerHTML = '<div class="text-muted-center">No IR generated.</div>';
      return;
    }

    irBox.innerHTML = this.lastCompileResult.ir.map(q => `
      <div class="ir-quad-item">
        <span class="ir-idx">${q.index}:</span>
        <span class="ir-text">${q.text}</span>
      </div>
    `).join('');
  }

  updatePipelineDetails() {
    const titleEl = this.containerPipeline?.querySelector('#pipe-details-title');
    const contentEl = this.containerPipeline?.querySelector('#pipe-details-content');
    if (!titleEl || !contentEl || !this.lastCompileResult) return;

    const res = this.lastCompileResult;

    switch (this.activeStage) {
      case 'source':
        titleEl.textContent = 'STAGE: SOURCE CODE';
        contentEl.innerHTML = `
          <div class="pipe-info-row"><strong>Lines of Code:</strong> ${res.rawLines.length}</div>
          <div class="pipe-info-row"><strong>Character Length:</strong> ${res.sourceCode.length} characters</div>
          <div class="pipe-info-row"><strong>Status:</strong> Ready for Lexical Phase</div>
        `;
        break;

      case 'lexical':
        titleEl.textContent = 'STAGE: LEXICAL ANALYZER';
        const sampleTokens = res.tokens.filter(t => t.type !== 'NEWLINE' && t.type !== 'EOF').slice(0, 6);
        contentEl.innerHTML = `
          <div class="pipe-info-row"><strong>Total Tokens:</strong> ${res.tokens.length}</div>
          <div class="token-mini-stream">
            ${sampleTokens.map(t => `<span class="tok-tag">${t.raw} &rarr; <small>${t.type}</small></span>`).join(' ')}
          </div>
        `;
        break;

      case 'syntax':
        titleEl.textContent = 'STAGE: SYNTAX ANALYZER';
        contentEl.innerHTML = `
          <div class="pipe-info-row"><strong>AST Nodes:</strong> ${res.ast.length} nodes parsed</div>
          <div class="pipe-info-row"><strong>Syntax Errors:</strong> ${res.errors.filter(e => e.stage === 'Syntax Analysis').length}</div>
          <div class="pipe-info-row"><strong>Status:</strong> ${res.stageStatus.syntax.status}</div>
        `;
        break;

      case 'semantic':
        titleEl.textContent = 'STAGE: SEMANTIC ANALYZER';
        contentEl.innerHTML = `
          <div class="pipe-info-row"><strong>Resolved Symbols:</strong> ${res.symbolTable.length} label(s)</div>
          <ul class="detail-bullet-list">
            ${res.symbolTable.map(s => `<li><span class="text-success">✓</span> Label '${s.name}' at 0x${s.address.toString(16).padStart(4, '0')}</li>`).join('')}
            ${res.symbolTable.length === 0 ? '<li><span class="text-muted">No labels defined in source</span></li>' : ''}
          </ul>
        `;
        break;

      case 'intermediate':
      default:
        titleEl.textContent = 'DETAILS (SEMANTIC & IR VERIFICATION)';
        contentEl.innerHTML = `
          <div class="line-detail-sample">
            <span class="detail-line-lead">Verified Architecture Instructions</span>
            <ul class="detail-bullet-list">
              <li><span class="text-success">✓</span> CPU Opcode translation completed</li>
              <li><span class="text-success">✓</span> 8-bit / 16-bit register bounds validated</li>
              <li><span class="text-success">✓</span> Memory addresses constrained within direct RAM limits</li>
              <li><span class="text-success">✓</span> 3-Address Code Quadruples generated</li>
            </ul>
          </div>
        `;
        break;

      case 'codegen':
        titleEl.textContent = 'STAGE: CODE GENERATOR';
        contentEl.innerHTML = `
          <div class="pipe-info-row"><strong>Machine Instructions:</strong> ${res.codeGen?.instructions.length || 0}</div>
          <div class="pipe-info-row"><strong>Total Bytes Emitted:</strong> ${res.codeGen?.totalBytes || 0} bytes</div>
        `;
        break;

      case 'machine':
        titleEl.textContent = 'STAGE: MACHINE CODE';
        contentEl.innerHTML = `
          <div class="pipe-info-row"><strong>Target Base Address:</strong> 0x0000</div>
          <div class="pipe-info-row"><strong>Format:</strong> 3-byte Custom Instruction Pack</div>
          <div class="pipe-info-row"><strong>Loaded to RAM:</strong> Ready for CPU Fetch-Decode Cycle</div>
        `;
        break;
    }
  }

  // --- EXECUTION CONTROL & LOG PANEL ---
  renderExecutionPanel() {
    if (!this.containerExecution) return;
    this.containerExecution.innerHTML = `
      <div class="panel-header-tabs">
        <button class="exec-tab-btn active" data-exectab="control" id="tab-exec-control">EXECUTION CONTROL</button>
        <button class="exec-tab-btn" data-exectab="log" id="tab-exec-log">EXECUTION LOG</button>
      </div>

      <div class="exec-tab-body" id="exec-tab-body-control">
        <div class="exec-meta-grid">
          <div class="exec-meta-cell">
            <span class="meta-label">Current Instruction</span>
            <div class="meta-val-large" id="exec-curr-inst">
              <span class="curr-cycle-num" id="exec-pc-indicator">00</span>
              <span class="curr-inst-text" id="exec-ir-text">NOP</span>
            </div>
          </div>
          <div class="exec-meta-cell">
            <span class="meta-label">Cycle Count</span>
            <div class="meta-val-mid" id="exec-cycle-val">00</div>
          </div>
          <div class="exec-meta-cell">
            <span class="meta-label">Execution Status</span>
            <div class="status-badge-container">
              <span class="badge-status-glow badge-ready" id="exec-status-badge">READY</span>
            </div>
          </div>
        </div>

        <div class="exec-buttons-bar">
          <button class="btn btn-ctrl btn-run" id="btn-ctrl-run" title="Run Continuous Simulation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Run
          </button>
          <button class="btn btn-ctrl btn-step" id="btn-ctrl-step" title="Step 1 Instruction (F10)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
            Step
          </button>
          <button class="btn btn-ctrl btn-pause" id="btn-ctrl-pause" title="Pause Simulation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            Pause
          </button>
          <button class="btn btn-ctrl btn-stop" id="btn-ctrl-stop" title="Stop Simulation (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>
            Stop
          </button>
          <button class="btn btn-ctrl btn-reset" id="btn-ctrl-reset" title="Reset Registers & RAM">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Reset
          </button>
        </div>

        <div class="speed-slider-row">
          <span class="speed-label">Speed</span>
          <span class="speed-sub">Slow</span>
          <input type="range" class="speed-slider" id="clock-speed-slider" min="50" max="1500" step="50" value="500" />
          <span class="speed-sub">Fast</span>
        </div>
      </div>

      <div class="exec-tab-body" id="exec-tab-body-log" style="display: none;">
        <div class="exec-log-scroll-box" id="exec-log-scroll-box">
          <div class="log-empty-msg">No instructions executed yet. Click Step or Run.</div>
        </div>
      </div>
    `;

    this.attachExecutionEvents();
  }

  attachExecutionEvents() {
    const controlTab = this.containerExecution.querySelector('#tab-exec-control');
    const logTab = this.containerExecution.querySelector('#tab-exec-log');
    const bodyControl = this.containerExecution.querySelector('#exec-tab-body-control');
    const bodyLog = this.containerExecution.querySelector('#exec-tab-body-log');

    controlTab.addEventListener('click', () => {
      controlTab.classList.add('active');
      logTab.classList.remove('active');
      bodyControl.style.display = 'block';
      bodyLog.style.display = 'none';
    });

    logTab.addEventListener('click', () => {
      logTab.classList.add('active');
      controlTab.classList.remove('active');
      bodyLog.style.display = 'block';
      bodyControl.style.display = 'none';
      this.updateExecutionLog();
    });

    // Control buttons
    this.containerExecution.querySelector('#btn-ctrl-run').addEventListener('click', () => this.simulator.run());
    this.containerExecution.querySelector('#btn-ctrl-step').addEventListener('click', () => this.simulator.step());
    this.containerExecution.querySelector('#btn-ctrl-pause').addEventListener('click', () => this.simulator.pause());
    this.containerExecution.querySelector('#btn-ctrl-stop').addEventListener('click', () => this.simulator.stop());
    this.containerExecution.querySelector('#btn-ctrl-reset').addEventListener('click', () => this.simulator.reset());

    // Speed slider
    const speedSlider = this.containerExecution.querySelector('#clock-speed-slider');
    speedSlider.addEventListener('input', () => {
      // Invert so higher value = faster (lower ms delay)
      const val = parseInt(speedSlider.value, 10);
      const delayMs = 1550 - val;
      this.simulator.setClockSpeed(delayMs);
    });
  }

  updateExecutionStatus() {
    if (!this.containerExecution) return;

    const pcInd = this.containerExecution.querySelector('#exec-pc-indicator');
    const irText = this.containerExecution.querySelector('#exec-ir-text');
    const cycleVal = this.containerExecution.querySelector('#exec-cycle-val');
    const statusBadge = this.containerExecution.querySelector('#exec-status-badge');

    if (pcInd) pcInd.textContent = this.cpu.cycleCount.toString().padStart(2, '0');
    if (irText) irText.textContent = this.cpu.IR || 'NOP';
    if (cycleVal) cycleVal.textContent = this.cpu.cycleCount.toString().padStart(2, '0');

    if (statusBadge) {
      statusBadge.textContent = this.cpu.status;
      statusBadge.className = `badge-status-glow badge-${this.cpu.status.toLowerCase()}`;
    }
  }

  updateExecutionLog() {
    const logBox = this.containerExecution?.querySelector('#exec-log-scroll-box');
    if (!logBox) return;

    if (this.simulator.executionLog.length === 0) {
      logBox.innerHTML = '<div class="log-empty-msg">No instructions executed yet. Click Step or Run.</div>';
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
