/**
 * Custom Assembly Studio - Code Editor Component
 * Features line numbers, active line execution pointer, breakpoint gutter,
 * syntax highlighting, compiler output / errors / warnings tabs, and file tab switching.
 */

export class EditorView {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.currentFile = 'main.asm';
    this.breakpoints = new Set(); // line numbers
    this.currentExecutingLine = null;
    this.cursorLine = 1;
    this.cursorCol = 1;

    this.onCodeChange = options.onCodeChange || (() => {});
    this.onBreakpointToggle = options.onBreakpointToggle || (() => {});
    this.onCompile = options.onCompile || (() => {});
    this.onRun = options.onRun || (() => {});
    this.onSave = options.onSave || (() => {});

    this.activeTab = 'compiler'; // 'compiler' | 'errors' | 'warnings'
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="editor-header">
        <div class="editor-tabs" id="editor-tabs-bar">
          <div class="editor-tab active" data-file="main.asm">
            <span class="file-icon">📄</span>
            <span class="file-title">main.asm</span>
            <span class="close-tab" title="Close">×</span>
          </div>
          <button class="add-tab-btn" id="add-new-file-btn" title="New File">+</button>
        </div>
        <div class="editor-actions">
          <button class="btn btn-sm btn-outline" id="editor-save-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Save
          </button>
          <button class="btn btn-sm btn-primary" id="editor-compile-btn" title="Compile Assembly (Ctrl+B)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            Compile
          </button>
        </div>
      </div>

      <div class="editor-workbench">
        <div class="code-editor-wrapper">
          <div class="gutter" id="editor-gutter"></div>
          <div class="editor-area-container">
            <pre class="highlight-layer" id="editor-highlight-layer" aria-hidden="true"></pre>
            <textarea class="code-input" id="editor-textarea" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="; Write custom assembly code here..."></textarea>
          </div>
        </div>
      </div>

      <div class="editor-output-drawer">
        <div class="output-tabs-header">
          <div class="output-tab active" data-tab="compiler" id="tab-btn-compiler">COMPILER OUTPUT</div>
          <div class="output-tab" data-tab="errors" id="tab-btn-errors">ERRORS <span class="badge badge-error" id="errors-count-badge">0</span></div>
          <div class="output-tab" data-tab="warnings" id="tab-btn-warnings">WARNINGS <span class="badge badge-warning" id="warnings-count-badge">0</span></div>
          <div class="output-drawer-tools">
            <button class="btn-icon" id="clear-output-btn" title="Clear Console">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
            </button>
          </div>
        </div>
        <div class="output-tab-body" id="output-tab-content">
          <div class="compiler-success-list" id="compiler-stage-checks">
            <div class="check-item"><span class="check-icon">✓</span> <span class="check-label">Lexical Analysis</span> <span class="check-status">Success</span></div>
            <div class="check-item"><span class="check-icon">✓</span> <span class="check-label">Syntax Analysis</span> <span class="check-status">Success</span></div>
            <div class="check-item"><span class="check-icon">✓</span> <span class="check-label">Semantic Analysis</span> <span class="check-status">Success</span></div>
            <div class="check-item"><span class="check-icon">✓</span> <span class="check-label">Intermediate Code Generation</span> <span class="check-status">Success</span></div>
            <div class="check-item"><span class="check-icon">✓</span> <span class="check-label">Code Generation</span> <span class="check-status">Success</span></div>
            <div class="check-item"><span class="check-icon">✓</span> <span class="check-label">Machine Code Generation</span> <span class="check-status">Success</span></div>
          </div>
        </div>
      </div>
    `;

    this.textarea = this.container.querySelector('#editor-textarea');
    this.highlightLayer = this.container.querySelector('#editor-highlight-layer');
    this.gutter = this.container.querySelector('#editor-gutter');
    this.outputContent = this.container.querySelector('#output-tab-content');

    this.attachEvents();
  }

  attachEvents() {
    // Textarea sync
    this.textarea.addEventListener('input', () => {
      this.updateGutterAndHighlight();
      this.onCodeChange(this.textarea.value);
    });

    this.textarea.addEventListener('scroll', () => {
      this.highlightLayer.scrollTop = this.textarea.scrollTop;
      this.highlightLayer.scrollLeft = this.textarea.scrollLeft;
      this.gutter.scrollTop = this.textarea.scrollTop;
    });

    // Tab key support (insert 2 spaces)
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;
        this.textarea.value = val.substring(0, start) + '  ' + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
        this.updateGutterAndHighlight();
        this.onCodeChange(this.textarea.value);
      }
    });

    // Cursor tracking
    const updateCursor = () => {
      const text = this.textarea.value.substring(0, this.textarea.selectionStart);
      const lines = text.split('\n');
      this.cursorLine = lines.length;
      this.cursorCol = lines[lines.length - 1].length + 1;
      const statusEl = document.getElementById('status-cursor-pos');
      if (statusEl) {
        statusEl.textContent = `Ln ${this.cursorLine}, Col ${this.cursorCol}`;
      }
    };
    this.textarea.addEventListener('keyup', updateCursor);
    this.textarea.addEventListener('click', updateCursor);

    // Save & Compile buttons
    this.container.querySelector('#editor-save-btn').addEventListener('click', () => {
      this.onSave(this.currentFile, this.textarea.value);
    });

    this.container.querySelector('#editor-compile-btn').addEventListener('click', () => {
      this.onCompile(this.textarea.value);
    });

    // Gutter click for breakpoints
    this.gutter.addEventListener('click', (e) => {
      const lineEl = e.target.closest('.gutter-line');
      if (lineEl) {
        const lineNum = parseInt(lineEl.dataset.line, 10);
        if (this.breakpoints.has(lineNum)) {
          this.breakpoints.delete(lineNum);
          lineEl.classList.remove('has-breakpoint');
        } else {
          this.breakpoints.add(lineNum);
          lineEl.classList.add('has-breakpoint');
        }
        this.onBreakpointToggle(lineNum, this.breakpoints.has(lineNum));
      }
    });

    // Output tab switcher
    const tabs = this.container.querySelectorAll('.output-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this.renderOutputTab();
      });
    });

    // Clear output
    this.container.querySelector('#clear-output-btn').addEventListener('click', () => {
      this.outputContent.innerHTML = '<div class="empty-state-muted">Output console cleared.</div>';
    });
  }

  setCode(code, filename = 'main.asm') {
    this.currentFile = filename;
    this.textarea.value = code;
    this.updateGutterAndHighlight();
  }

  getCode() {
    return this.textarea.value;
  }

  setExecutingLine(lineNum) {
    this.currentExecutingLine = lineNum;
    this.updateGutterAndHighlight();
  }

  updateGutterAndHighlight() {
    const code = this.textarea.value;
    const lines = code.split('\n');
    const totalLines = lines.length;

    // Update status bar lines
    const lineCountEl = document.getElementById('status-total-lines');
    if (lineCountEl) {
      lineCountEl.textContent = `${totalLines} Lines`;
    }

    // Build Gutter HTML
    let gutterHtml = '';
    for (let i = 1; i <= totalLines; i++) {
      const isExecuting = (this.currentExecutingLine === i);
      const isBreakpoint = this.breakpoints.has(i);
      const classes = ['gutter-line'];
      if (isExecuting) classes.push('executing-line');
      if (isBreakpoint) classes.push('has-breakpoint');

      gutterHtml += `
        <div class="${classes.join(' ')}" data-line="${i}">
          <span class="bp-dot" title="Toggle Breakpoint"></span>
          <span class="exec-arrow">${isExecuting ? '▶' : ''}</span>
          <span class="line-num">${i.toString().padStart(2, '0')}</span>
        </div>
      `;
    }
    this.gutter.innerHTML = gutterHtml;

    // Syntax highlight preview layer
    this.highlightLayer.innerHTML = this.highlightAssembly(code, this.currentExecutingLine);
  }

  highlightAssembly(code, currentExecLine) {
    const lines = code.split('\n');
    return lines.map((line, idx) => {
      const lineNum = idx + 1;
      const isExec = (currentExecLine === lineNum);
      const highlighted = this.colorizeLine(line);
      return `<div class="code-line ${isExec ? 'active-exec-row' : ''}">${highlighted || '&nbsp;'}</div>`;
    }).join('');
  }

  colorizeLine(line) {
    // 1. Check for comments
    let commentPart = '';
    let codePart = line;

    const semiIdx = line.indexOf(';');
    if (semiIdx !== -1) {
      codePart = line.substring(0, semiIdx);
      commentPart = `<span class="tok-comment">${this.escapeHtml(line.substring(semiIdx))}</span>`;
    }

    // 2. Tokenize code part with regex
    const tokenRegex = /([a-zA-Z_][a-zA-Z0-9_]*:)|(\b(?:MOV|ADD|SUB|MUL|DIV|AND|OR|XOR|NOT|LOAD|STORE|CMP|JMP|JZ|JNZ|JC|JNC|JN|PUSH|POP|CALL|RET|NOP|HALT)\b)|(\b(?:R[0-7]|PC|SP|FLAGS)\b)|(\b0x[0-9a-fA-F]+\b|\b0b[01]+\b|\b\d+\b)|([,\[\]:])|([^\s,\[\]:]+)/gi;

    const highlightedCode = codePart.replace(tokenRegex, (match, label, inst, reg, num, delim, other) => {
      if (label) return `<span class="tok-label">${this.escapeHtml(match)}</span>`;
      if (inst) return `<span class="tok-instruction">${this.escapeHtml(match.toUpperCase())}</span>`;
      if (reg) return `<span class="tok-register">${this.escapeHtml(match.toUpperCase())}</span>`;
      if (num) return `<span class="tok-number">${this.escapeHtml(match)}</span>`;
      if (delim) return `<span class="tok-delim">${this.escapeHtml(match)}</span>`;
      return `<span class="tok-ident">${this.escapeHtml(match)}</span>`;
    });

    return highlightedCode + commentPart;
  }

  setCompilerResult(result) {
    this.lastResult = result;

    // Badges count
    const errBadge = this.container.querySelector('#errors-count-badge');
    const warnBadge = this.container.querySelector('#warnings-count-badge');
    if (errBadge) errBadge.textContent = result.errors.length;
    if (warnBadge) warnBadge.textContent = result.warnings.length;

    // Auto-switch to errors tab if compilation failed
    if (!result.success && result.errors.length > 0) {
      this.activeTab = 'errors';
      this.container.querySelectorAll('.output-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === 'errors');
      });
    }

    this.renderOutputTab();
  }

  renderOutputTab() {
    if (!this.lastResult) return;

    if (this.activeTab === 'compiler') {
      const status = this.lastResult.stageStatus;
      this.outputContent.innerHTML = `
        <div class="compiler-success-list">
          <div class="check-item"><span class="check-icon ${status.lexical.status === 'Success' ? 'check-pass' : 'check-fail'}">${status.lexical.status === 'Success' ? '✓' : '✗'}</span> <span class="check-label">Lexical Analysis</span> <span class="check-status ${status.lexical.status === 'Success' ? 'status-pass' : 'status-fail'}">${status.lexical.status}</span> <span class="check-detail">(${status.lexical.details})</span></div>
          <div class="check-item"><span class="check-icon ${status.syntax.status === 'Success' ? 'check-pass' : 'check-fail'}">${status.syntax.status === 'Success' ? '✓' : '✗'}</span> <span class="check-label">Syntax Analysis</span> <span class="check-status ${status.syntax.status === 'Success' ? 'status-pass' : 'status-fail'}">${status.syntax.status}</span> <span class="check-detail">(${status.syntax.details})</span></div>
          <div class="check-item"><span class="check-icon ${status.semantic.status === 'Success' ? 'check-pass' : 'check-fail'}">${status.semantic.status === 'Success' ? '✓' : '✗'}</span> <span class="check-label">Semantic Analysis</span> <span class="check-status ${status.semantic.status === 'Success' ? 'status-pass' : 'status-fail'}">${status.semantic.status}</span> <span class="check-detail">(${status.semantic.details})</span></div>
          <div class="check-item"><span class="check-icon ${status.ir.status === 'Success' ? 'check-pass' : 'check-fail'}">${status.ir.status === 'Success' ? '✓' : '✗'}</span> <span class="check-label">Intermediate Code Generation</span> <span class="check-status ${status.ir.status === 'Success' ? 'status-pass' : 'status-fail'}">${status.ir.status}</span> <span class="check-detail">(${status.ir.details})</span></div>
          <div class="check-item"><span class="check-icon ${status.codeGen.status === 'Success' ? 'check-pass' : 'check-fail'}">${status.codeGen.status === 'Success' ? '✓' : '✗'}</span> <span class="check-label">Code Generation</span> <span class="check-status ${status.codeGen.status === 'Success' ? 'status-pass' : 'status-fail'}">${status.codeGen.status}</span> <span class="check-detail">(${status.codeGen.details})</span></div>
          <div class="check-item"><span class="check-icon ${status.machineCode.status === 'Success' ? 'check-pass' : 'check-fail'}">${status.machineCode.status === 'Success' ? '✓' : '✗'}</span> <span class="check-label">Machine Code Generation</span> <span class="check-status ${status.machineCode.status === 'Success' ? 'status-pass' : 'status-fail'}">${status.machineCode.status}</span> <span class="check-detail">(${status.machineCode.details})</span></div>
        </div>
        <div class="compiler-summary-meta">
          <span>Compiled in <strong>${this.lastResult.compileTimeMs}ms</strong></span> • 
          <span>Status: <strong class="${this.lastResult.success ? 'text-success' : 'text-danger'}">${this.lastResult.success ? 'COMPILATION SUCCESSFUL' : 'COMPILATION FAILED'}</strong></span>
        </div>
      `;
    } else if (this.activeTab === 'errors') {
      if (this.lastResult.errors.length === 0) {
        this.outputContent.innerHTML = `<div class="empty-state-success"><span class="text-success">✓</span> No compilation errors found. Program is valid.</div>`;
      } else {
        let errHtml = `<div class="error-banner">⚠ Compilation Failed (${this.lastResult.errors.length} error(s) found)</div><div class="error-cards-container">`;
        for (const err of this.lastResult.errors) {
          errHtml += `
            <div class="error-card">
              <div class="error-card-header">
                <span class="error-stage-tag">${err.stage || 'Parser'}</span>
                <span class="error-line-tag">Line ${err.line.toString().padStart(2, '0')}</span>
              </div>
              <div class="error-message">${this.escapeHtml(err.message)}</div>
              ${err.expected ? `
                <div class="error-diagnostic-row">
                  <div class="diag-col"><span class="diag-label">Expected:</span> <code class="diag-code expected">${this.escapeHtml(err.expected)}</code></div>
                  <div class="diag-col"><span class="diag-label">Found:</span> <code class="diag-code found">${this.escapeHtml(err.found || 'None')}</code></div>
                </div>
              ` : ''}
            </div>
          `;
        }
        errHtml += '</div>';
        this.outputContent.innerHTML = errHtml;
      }
    } else if (this.activeTab === 'warnings') {
      if (this.lastResult.warnings.length === 0) {
        this.outputContent.innerHTML = `<div class="empty-state-muted">No compilation warnings detected.</div>`;
      } else {
        let warnHtml = `<div class="warning-cards-container">`;
        for (const warn of this.lastResult.warnings) {
          warnHtml += `
            <div class="warning-card">
              <div class="warning-header">Line ${warn.line}: ${warn.stage || 'Warning'}</div>
              <div class="warning-msg">${this.escapeHtml(warn.message)}</div>
            </div>
          `;
        }
        warnHtml += '</div>';
        this.outputContent.innerHTML = warnHtml;
      }
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
