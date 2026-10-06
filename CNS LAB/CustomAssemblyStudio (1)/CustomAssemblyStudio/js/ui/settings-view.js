/**
 * Custom Assembly Studio - Settings & Configuration View
 * Manages processor clock speed, memory size, theme customization,
 * editor preferences, and artifact export (Hex, Disassembly, JSON).
 */

export class SettingsView {
  constructor(container, simulator, memory, cpu, options = {}) {
    this.container = container;
    this.simulator = simulator;
    this.memory = memory;
    this.cpu = cpu;
    this.options = options;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="settings-page-container">
        <div class="settings-header">
          <h2 class="settings-heading">Architecture & Studio Settings</h2>
          <p class="settings-subheading">Configure processor simulation parameters, UI themes, and export artifacts.</p>
        </div>

        <div class="settings-sections-grid">
          <!-- Architecture Settings -->
          <div class="dash-card">
            <div class="card-header-clean">
              <span class="card-title-strong">PROCESSOR ARCHITECTURE</span>
            </div>
            <div class="setting-row">
              <div class="setting-meta">
                <span class="set-title">Default Clock Speed</span>
                <span class="set-desc">Execution delay per CPU instruction cycle</span>
              </div>
              <select class="select-input" id="setting-clock-speed">
                <option value="1000">1.0 Hz (1000ms - Step by Step)</option>
                <option value="500" selected>2.0 Hz (500ms - Standard)</option>
                <option value="250">4.0 Hz (250ms - Fast)</option>
                <option value="100">10 Hz (100ms - High Speed)</option>
              </select>
            </div>

            <div class="setting-row">
              <div class="setting-meta">
                <span class="set-title">Addressable RAM Size</span>
                <span class="set-desc">Direct memory array capacity</span>
              </div>
              <select class="select-input" id="setting-ram-size">
                <option value="256" selected>256 Bytes (Direct 8-bit addressing)</option>
                <option value="512">512 Bytes</option>
                <option value="1024">1024 Bytes (1 KB)</option>
              </select>
            </div>

            <div class="setting-row">
              <div class="setting-meta">
                <span class="set-title">Register Word Width</span>
                <span class="set-desc">ALU and register bit capacity</span>
              </div>
              <div class="toggle-pill-group">
                <span class="badge badge-primary">16-Bit Word</span>
              </div>
            </div>
          </div>

          <!-- Studio & Editor Settings -->
          <div class="dash-card">
            <div class="card-header-clean">
              <span class="card-title-strong">IDE & THEME PREFERENCES</span>
            </div>
            <div class="setting-row">
              <div class="setting-meta">
                <span class="set-title">Color Palette Theme</span>
                <span class="set-desc">Studio visual styling</span>
              </div>
              <select class="select-input" id="setting-theme-picker">
                <option value="theme-dark-studio" selected>Dark Professional Studio (Default)</option>
                <option value="theme-midnight-cyber">Midnight Obsidian & Cyan</option>
                <option value="theme-deep-navy">Deep Architectural Navy</option>
              </select>
            </div>

            <div class="setting-row">
              <div class="setting-meta">
                <span class="set-title">Syntax Highlighting</span>
                <span class="set-desc">Colorize assembly mnemonics, registers, numbers</span>
              </div>
              <div class="toggle-pill-group">
                <span class="badge badge-success">Enabled</span>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-meta">
                <span class="set-title">Auto-Compile On Type</span>
                <span class="set-desc">Run syntax analysis as code is entered</span>
              </div>
              <input type="checkbox" id="setting-auto-compile" checked />
            </div>
          </div>

          <!-- Export & Artifacts -->
          <div class="dash-card full-col-card">
            <div class="card-header-clean">
              <span class="card-title-strong">EXPORT CAPSTONE ARTIFACTS</span>
              <span class="card-badge-muted">Generate binary and reports</span>
            </div>
            <div class="export-buttons-grid">
              <button class="btn btn-outline" id="export-hex-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Export Intel/Raw Hex (.hex)
              </button>
              <button class="btn btn-outline" id="export-disasm-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                Export Assembly Disassembly (.asm)
              </button>
              <button class="btn btn-outline" id="export-telemetry-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Export Execution Telemetry (.json)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    this.container.querySelector('#setting-clock-speed')?.addEventListener('change', (e) => {
      this.simulator.setClockSpeed(parseInt(e.target.value, 10));
    });

    this.container.querySelector('#setting-theme-picker')?.addEventListener('change', (e) => {
      document.body.className = e.target.value;
    });

    this.container.querySelector('#export-hex-btn')?.addEventListener('click', () => {
      const bytes = Array.from(this.memory.bytes.slice(0, 64));
      const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
      this.downloadFile('program.hex', hex, 'text/plain');
    });

    this.container.querySelector('#export-disasm-btn')?.addEventListener('click', () => {
      const lines = Array.from(this.cpu.instructionMap.values()).map(i => `${i.hexAddress}:  ${i.assembly}`);
      this.downloadFile('disassembly.asm', lines.join('\n'), 'text/plain');
    });

    this.container.querySelector('#export-telemetry-btn')?.addEventListener('click', () => {
      const data = JSON.stringify({
        architecture: 'Custom 16-bit / 8-bit RISC/CISC Hybrid',
        analytics: this.simulator.analytics,
        registers: Array.from(this.cpu.registers),
        flags: this.cpu.alu.flags,
        executionLog: this.simulator.executionLog
      }, null, 2);
      this.downloadFile('telemetry_report.json', data, 'application/json');
    });
  }

  downloadFile(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
