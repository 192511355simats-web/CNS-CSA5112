/**
 * Custom Assembly Studio - Main Application Coordinator
 * Integrates Compiler, CPU Engine, Virtual Memory, and all UI views.
 */

import { Compiler } from './compiler/compiler.js';
import { Memory } from './engine/memory.js';
import { CPU } from './engine/cpu.js';
import { Simulator } from './engine/simulator.js';
import { SAMPLE_PROGRAMS } from './samples/programs.js';

import { EditorView } from './ui/editor-view.js';
import { CPUView } from './ui/cpu-view.js';
import { MemoryView } from './ui/memory-view.js';
import { WorkbenchPipeline } from './ui/workbench-pipeline.js';

import { DashboardView } from './ui/dashboard-view.js';
import { CompilerPage } from './ui/compiler-page.js';
import { DebuggerView } from './ui/debugger-view.js';
import { InstructionSetView } from './ui/instruction-set.js';
import { AnalyticsView } from './ui/analytics-view.js';
import { SettingsView } from './ui/settings-view.js';

class App {
  constructor() {
    this.memory = new Memory(256);
    this.cpu = new CPU(this.memory);
    this.simulator = new Simulator(this.cpu, this.memory);
    this.compiler = new Compiler();

    this.currentView = 'editor'; // 'dashboard' | 'editor' | 'compiler' | 'simulator' | 'debugger' | 'memory' | 'instructions' | 'analytics' | 'settings'
    this.currentFile = 'main.asm';
    this.fileStorage = { ...SAMPLE_PROGRAMS };

    this.initViews();
    this.attachGlobalEvents();
    this.initClock();

    // Initial compile with default program
    this.loadFile('main.asm');
  }

  initViews() {
    // 1. Editor View
    this.editorView = new EditorView(document.getElementById('view-panel-editor'), {
      onCodeChange: (code) => {
        this.fileStorage[this.currentFile].code = code;
        const autoComp = document.getElementById('setting-auto-compile');
        if (!autoComp || autoComp.checked) {
          this.compileCode(code, false);
        }
      },
      onCompile: (code) => {
        this.compileCode(code, true);
      },
      onSave: (filename, code) => {
        this.fileStorage[filename] = {
          name: filename,
          title: filename,
          description: 'User saved assembly file',
          code
        };
        this.showToast(`Saved ${filename} successfully!`);
      },
      onBreakpointToggle: (line, isSet) => {
        // Map line to instruction address
        const inst = Array.from(this.cpu.instructionMap.values()).find(i => i.line === line);
        if (inst) {
          this.simulator.toggleBreakpoint(inst.address);
        }
      }
    });

    // 2. CPU and ALU Views
    this.cpuView = new CPUView(
      this.cpu,
      document.getElementById('view-panel-registers'),
      document.getElementById('view-panel-cpu-overview'),
      document.getElementById('view-panel-alu')
    );

    // 3. Memory View
    this.memoryView = new MemoryView(this.memory, document.getElementById('view-panel-memory'));

    // 4. Workbench Panels (Machine Code, Pipeline, Execution Control)
    this.workbenchPipeline = new WorkbenchPipeline({
      containerMachineCode: document.getElementById('view-panel-machine-code'),
      containerPipeline: document.getElementById('view-panel-pipeline'),
      containerExecution: document.getElementById('view-panel-execution'),
      simulator: this.simulator,
      cpu: this.cpu
    });

    // 5. Dedicated Full-Page Views
    this.dashboardView = new DashboardView(document.getElementById('page-dashboard'), {
      onLoadProgram: (file) => this.loadFile(file),
      onNavigate: (view) => this.switchView(view)
    });

    this.compilerPage = new CompilerPage(document.getElementById('page-compiler'));
    this.debuggerView = new DebuggerView(document.getElementById('page-debugger'), this.simulator, this.cpu);
    this.instructionSetView = new InstructionSetView(document.getElementById('page-instructions'), {
      onInsertCode: (snippet) => {
        const current = this.editorView.getCode();
        this.editorView.setCode(current + '\n' + snippet, this.currentFile);
        this.switchView('editor');
      }
    });
    this.analyticsView = new AnalyticsView(document.getElementById('page-analytics'), this.simulator);
    this.settingsView = new SettingsView(document.getElementById('page-settings'), this.simulator, this.memory, this.cpu);

    // Subscribe to simulator steps to update active executing line in code editor
    this.simulator.subscribe((event, sim) => {
      this.updateStatusText();
      if (event === 'step') {
        const inst = sim.cpu.instructionMap.get(sim.cpu.PC);
        if (inst) {
          this.editorView.setExecutingLine(inst.line);
        }
      } else if (event === 'reset') {
        this.editorView.setExecutingLine(null);
      }
    });
  }

  compileCode(code, showToastOnSuccess = true) {
    const result = this.compiler.compile(code);

    // Send compilation results to all views
    this.editorView.setCompilerResult(result);
    this.workbenchPipeline.setCompileResult(result);
    this.compilerPage.setCompileResult(result);
    this.dashboardView.updateMetrics(result, this.simulator);

    if (result.success) {
      this.cpu.loadProgram(result);
      if (showToastOnSuccess) {
        this.showToast(`Compilation successful (${result.compileTimeMs} ms)`);
      }
      this.setStatusText('Compilation Successful: Ready to Execute');
    } else {
      this.setStatusText(`Compilation Error: ${result.errors.length} issue(s) detected`);
    }

    return result;
  }

  loadFile(filename) {
    if (filename === 'new') {
      const newName = `prog_${Date.now().toString().slice(-4)}.asm`;
      this.fileStorage[newName] = {
        name: newName,
        title: 'New Assembly File',
        code: `; New Custom Assembly Program\n\nMOV R1, 0\nHALT\n`
      };
      this.currentFile = newName;
      this.updateFileList();
      this.editorView.setCode(this.fileStorage[newName].code, newName);
      this.compileCode(this.fileStorage[newName].code, false);
      return;
    }

    if (this.fileStorage[filename]) {
      this.currentFile = filename;
      this.editorView.setCode(this.fileStorage[filename].code, filename);
      this.compileCode(this.fileStorage[filename].code, false);
      this.updateFileList();
    }
  }

  updateFileList() {
    const listContainer = document.getElementById('project-files-list');
    if (!listContainer) return;

    listContainer.innerHTML = Object.keys(this.fileStorage).map(fn => `
      <div class="file-item-row ${fn === this.currentFile ? 'active' : ''}" data-file="${fn}">
        <span class="f-icon">📄</span>
        <span class="f-name">${fn}</span>
      </div>
    `).join('');

    listContainer.querySelectorAll('.file-item-row').forEach(row => {
      row.addEventListener('click', () => {
        this.loadFile(row.dataset.file);
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Update sidebar navigation pills
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Toggle view containers
    const allPages = document.querySelectorAll('.app-page-view');
    allPages.forEach(p => p.classList.remove('active-page'));

    if (viewName === 'editor') {
      document.getElementById('page-workbench')?.classList.add('active-page');
    } else if (viewName === 'dashboard') {
      document.getElementById('page-dashboard')?.classList.add('active-page');
      this.dashboardView.updateMetrics(this.compiler.lastResult, this.simulator);
    } else if (viewName === 'compiler') {
      document.getElementById('page-compiler')?.classList.add('active-page');
      if (this.compiler.lastResult) this.compilerPage.setCompileResult(this.compiler.lastResult);
    } else if (viewName === 'simulator') {
      // Expanded CPU Simulator page
      document.getElementById('page-cpu-expanded')?.classList.add('active-page');
    } else if (viewName === 'debugger') {
      document.getElementById('page-debugger')?.classList.add('active-page');
      this.debuggerView.update();
    } else if (viewName === 'memory') {
      document.getElementById('page-memory-expanded')?.classList.add('active-page');
    } else if (viewName === 'instructions') {
      document.getElementById('page-instructions')?.classList.add('active-page');
    } else if (viewName === 'analytics') {
      document.getElementById('page-analytics')?.classList.add('active-page');
      this.analyticsView.update();
    } else if (viewName === 'settings') {
      document.getElementById('page-settings')?.classList.add('active-page');
    }
  }

  attachGlobalEvents() {
    // Left Sidebar Navigation
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchView(item.dataset.view);
      });
    });

    // Header Global Controls
    document.getElementById('header-btn-run')?.addEventListener('click', () => {
      this.simulator.run();
    });
    document.getElementById('header-btn-step')?.addEventListener('click', () => {
      this.simulator.step();
    });
    document.getElementById('header-btn-pause')?.addEventListener('click', () => {
      this.simulator.pause();
    });
    document.getElementById('header-btn-stop')?.addEventListener('click', () => {
      this.simulator.stop();
    });
    document.getElementById('header-btn-reset')?.addEventListener('click', () => {
      this.simulator.reset();
    });

    // Theme toggle button
    document.getElementById('header-btn-theme')?.addEventListener('click', () => {
      const themes = ['theme-dark-studio', 'theme-midnight-cyber', 'theme-deep-navy'];
      const current = document.body.className || 'theme-dark-studio';
      const next = themes[(themes.indexOf(current) + 1) % themes.length];
      document.body.className = next;
      this.showToast(`Switched theme: ${next.replace('theme-', '').replace('-', ' ')}`);
    });

    // Help Modal
    const helpModal = document.getElementById('help-modal-overlay');
    document.getElementById('header-btn-help')?.addEventListener('click', () => {
      helpModal.style.display = 'flex';
    });
    document.getElementById('help-modal-close-btn')?.addEventListener('click', () => {
      helpModal.style.display = 'none';
    });
    helpModal?.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.style.display = 'none';
    });

    // Keyboard Shortcuts (F5 Run, F10 Step, Esc Stop, Ctrl+B Compile)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        this.simulator.run();
      } else if (e.key === 'F10') {
        e.preventDefault();
        this.simulator.step();
      } else if (e.key === 'Escape') {
        this.simulator.stop();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        this.compileCode(this.editorView.getCode(), true);
      }
    });
  }

  initClock() {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      const timeEl = document.getElementById('status-clock-time');
      if (timeEl) timeEl.textContent = timeStr;
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  setStatusText(msg) {
    const statusEl = document.getElementById('status-main-state');
    if (statusEl) statusEl.textContent = msg;
  }

  updateStatusText() {
    this.setStatusText(`CPU: ${this.cpu.status} | PC: 0x${this.cpu.PC.toString(16).toUpperCase().padStart(4, '0')} | Cycle: ${this.cpu.cycleCount}`);
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show-toast');
    setTimeout(() => {
      toast.classList.remove('show-toast');
    }, 2500);
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.customAssemblyStudio = new App();
});
