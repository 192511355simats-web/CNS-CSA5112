/**
 * Custom Assembly Studio - Hexadecimal Memory Inspector
 * Provides a byte-addressable RAM table with HEX, DEC, and BIN toggles,
 * ASCII decoded characters, search & jump-to-address, and active access cell highlighting.
 */

export class MemoryView {
  constructor(memory, container) {
    this.memory = memory;
    this.container = container;
    this.viewMode = 'HEX'; // 'HEX' | 'DEC' | 'BIN'
    this.displayRange = 128; // display first 128 bytes by default with scroll
    this.searchQuery = '';

    this.render();
    this.memory.subscribe(() => this.updateTable());
  }

  render() {
    this.container.innerHTML = `
      <div class="panel-header">
        <span class="panel-title">MEMORY VIEWER</span>
        <div class="memory-header-controls">
          <div class="mode-toggle-group">
            <button class="mode-btn active" data-mode="HEX">HEX</button>
            <button class="mode-btn" data-mode="DEC">DEC</button>
            <button class="mode-btn" data-mode="BIN">BIN</button>
          </div>
        </div>
      </div>
      <div class="memory-search-bar">
        <input type="text" class="mem-search-input" id="mem-search-input" placeholder="Jump to Address (e.g. 0x0064 or 100)" />
        <button class="btn btn-xs btn-outline" id="mem-search-go-btn">Go</button>
      </div>
      <div class="memory-table-scroll-container" id="memory-scroll-box">
        <table class="memory-table">
          <thead>
            <tr>
              <th>Address</th>
              <th id="th-val-mode">HEX</th>
              <th>DEC</th>
              <th>ASCII</th>
            </tr>
          </thead>
          <tbody id="memory-tbody"></tbody>
        </table>
      </div>
    `;

    this.tbody = this.container.querySelector('#memory-tbody');
    this.scrollBox = this.container.querySelector('#memory-scroll-box');
    this.searchInput = this.container.querySelector('#mem-search-input');

    this.attachEvents();
    this.updateTable();
  }

  attachEvents() {
    const modeBtns = this.container.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.viewMode = btn.dataset.mode;
        const thMode = this.container.querySelector('#th-val-mode');
        if (thMode) thMode.textContent = this.viewMode;
        this.updateTable();
      });
    });

    const doSearch = () => {
      const q = this.searchInput.value.trim();
      let targetAddr = null;
      if (q.toLowerCase().startsWith('0x')) {
        targetAddr = parseInt(q, 16);
      } else if (!isNaN(parseInt(q, 10))) {
        targetAddr = parseInt(q, 10);
      }

      if (targetAddr !== null && !isNaN(targetAddr) && targetAddr >= 0 && targetAddr < this.memory.size) {
        this.scrollToAddress(targetAddr);
      }
    };

    this.container.querySelector('#mem-search-go-btn').addEventListener('click', doSearch);
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }

  updateTable() {
    if (!this.tbody) return;

    let rowsHtml = '';
    const lastAddr = this.memory.lastAccessedAddress;

    // Display addresses: 0x0000 to 0x00FF (256 bytes)
    for (let addr = 0; addr < this.memory.size; addr++) {
      const rowData = this.memory.getFormattedRow(addr);
      const isAccessed = (lastAddr === addr);

      let primaryVal = rowData.hex;
      if (this.viewMode === 'DEC') primaryVal = rowData.dec;
      if (this.viewMode === 'BIN') primaryVal = rowData.bin;

      rowsHtml += `
        <tr id="mem-row-${addr}" class="${isAccessed ? 'active-memory-row' : ''} ${rowData.dec !== '0' ? 'has-data-row' : ''}">
          <td class="mem-addr-cell">${rowData.hexAddress}</td>
          <td class="mem-val-cell ${isAccessed ? 'text-highlight-gold' : ''}">${primaryVal}</td>
          <td class="mem-dec-cell">${rowData.dec}</td>
          <td class="mem-ascii-cell">${rowData.ascii}</td>
        </tr>
      `;
    }

    this.tbody.innerHTML = rowsHtml;

    // If there was an access, auto scroll to that row
    if (lastAddr !== null) {
      const row = this.tbody.querySelector(`#mem-row-${lastAddr}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  scrollToAddress(addr) {
    const row = this.tbody.querySelector(`#mem-row-${addr}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.classList.add('search-highlight-pulse');
      setTimeout(() => row.classList.remove('search-highlight-pulse'), 1500);
    }
  }
}
