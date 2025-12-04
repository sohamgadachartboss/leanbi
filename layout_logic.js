// Dashboard Layout Logic
// This file contains all the static JavaScript code for the dashboard wireframe builder
// The SPEC object should be defined in the HTML file before loading this script

// Global variables
let currentTab = 'tab_1';
let components = [];
let editMode = false;
let selectedComponentId = null;
let unitSize = 80;
let originalSpec = null;
let workingSpec = null;
let hasUnsavedChanges = false;
let editedComponents = new Set();

// Count available tabs
function countTabs() {
    let count = 0;
    Object.keys(SPEC).forEach(key => {
        if (key.startsWith('tab_')) {
            count++;
        }
    });
    return count;
}

// Generate tab selector radio buttons
function generateTabSelector() {
    const tabSelector = document.getElementById('tabSelector');
    const tabCount = countTabs();

    for (let i = 1; i <= tabCount; i++) {
        const tabKey = `tab_${i}`;
        const label = document.createElement('label');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'tabRadio';
        radio.value = tabKey;
        radio.checked = (i === 1);
        radio.addEventListener('change', () => switchTab(tabKey));

        const span = document.createElement('span');
        span.textContent = `Tab ${i}`;

        label.appendChild(radio);
        label.appendChild(span);
        tabSelector.appendChild(label);
    }
}

// Initialize grid
function initializeGrid() {
    const tabData = SPEC[currentTab];
    const container = document.getElementById('gridContainer');
    const canvas = document.getElementById('gridCanvas');

    const width = tabData.columns * unitSize;
    const height = tabData.rows * unitSize;

    container.style.width = width + 'px';
    container.style.height = height + 'px';

    canvas.width = width;
    canvas.height = height;

    drawGrid(canvas, tabData.columns, tabData.rows);
}

// Draw grid lines
function drawGrid(canvas, cols, rows) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * unitSize, 0);
        ctx.lineTo(i * unitSize, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * unitSize);
        ctx.lineTo(canvas.width, j * unitSize);
        ctx.stroke();
    }
}

// Parse position string
function parsePosition(positionStr) {
    const match = positionStr.match(/Tab\d+!R(\d+)C(\d+)/);
    if (match) {
        return {
            row: parseInt(match[1]) - 1,
            col: parseInt(match[2]) - 1
        };
    }
    return { row: 0, col: 0 };
}

// Load components from spec
function loadComponents() {
    components = [];
    const tabData = SPEC[currentTab];

    Object.keys(tabData).forEach(key => {
        if (key.startsWith(currentTab + '_comp_')) {
            const comp = tabData[key];
            const pos = parsePosition(comp.position);

            components.push({
                id: key,
                type: comp.representation_type,
                data: comp.data,
                microPrompt: comp.micro_prompt,
                imageSrc: comp.image_src || '',
                row: pos.row,
                col: pos.col,
                width: comp.width,
                height: comp.height,
                importance: comp.importance
            });
        }
    });
}

// Render all components
function renderComponents() {
    const container = document.getElementById('gridContainer');

    // Clear existing components
    const existingComps = container.querySelectorAll('.component');
    existingComps.forEach(comp => comp.remove());

    // Render each component
    components.forEach(comp => {
        renderComponent(comp);
    });
}

// Render single component
function renderComponent(comp) {
    const container = document.getElementById('gridContainer');
    const compDiv = document.createElement('div');
    compDiv.className = 'component';
    compDiv.id = comp.id;
    compDiv.setAttribute('data-origin-row', comp.row);
    compDiv.setAttribute('data-origin-col', comp.col);
    compDiv.setAttribute('data-width', comp.width);
    compDiv.setAttribute('data-height', comp.height);

    // Position and size
    updateComponentPosition(compDiv, comp);

    // Header
    const header = document.createElement('div');
    header.className = 'component-header';

    const compId = document.createElement('div');
    compId.className = 'component-id';
    compId.textContent = comp.id.toUpperCase();

    header.appendChild(compId);
    compDiv.appendChild(header);

    // Title
    const title = document.createElement('div');
    title.className = 'component-title';
    title.textContent = comp.data.label || comp.type;
    compDiv.appendChild(title);

    // Empty content div with proper ID format
    const content = document.createElement('div');
    content.className = 'component-content';
    content.id = comp.id; // ID format: tab_1_comp_1, tab_1_comp_2, etc.

    compDiv.appendChild(content);

    // Interactive controls
    compDiv.appendChild(createMoveControls(comp.id));
    compDiv.appendChild(createResizeControls(comp.id));

    // Click to select
    compDiv.addEventListener('click', (e) => {
        if (editMode && !e.target.closest('.component-controls')) {
            selectComponent(comp.id);
        }
    });

    container.appendChild(compDiv);
}

// Create KPI content
function createKPIContent(data) {
    const kpiCard = document.createElement('div');
    kpiCard.className = 'kpi-card';

    const value = document.createElement('div');
    value.className = 'kpi-value';
    value.textContent = (data.unit || '') + formatNumber(data.value);

    const label = document.createElement('div');
    label.className = 'kpi-label';
    label.textContent = data.label;

    const change = document.createElement('div');
    change.className = 'kpi-change ' + (data.change.startsWith('+') ? 'positive' : 'negative');
    change.innerHTML = (data.change.startsWith('+') ? '↑' : '↓') + ' ' + data.change;

    const comparison = document.createElement('div');
    comparison.className = 'kpi-comparison';
    comparison.textContent = data.comparison_label;

    kpiCard.appendChild(value);
    kpiCard.appendChild(label);
    kpiCard.appendChild(change);
    kpiCard.appendChild(comparison);

    return kpiCard;
}

// Create chart content - USING ACTUAL IMAGES
function createChartContent(comp) {
    if (comp.imageSrc && comp.imageSrc.startsWith('data:image')) {
        const img = document.createElement('img');
        img.className = 'chart-image';
        img.src = comp.imageSrc;
        img.alt = comp.microPrompt;
        return img;
    } else {
        // Fallback placeholder if no image
        const placeholder = document.createElement('div');
        placeholder.style.width = '100%';
        placeholder.style.height = '100%';
        placeholder.style.background = '#f8f8f8';
        placeholder.style.border = '1px dashed #ccc';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.color = '#999';
        placeholder.textContent = `${comp.type} (${comp.id})`;
        return placeholder;
    }
}

// Create table content
function createTableContent(data) {
    const table = document.createElement('table');
    table.className = 'component-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    data.columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    data.rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
}

// Create move controls
function createMoveControls(compId) {
    const controls = document.createElement('div');
    controls.className = 'component-controls move-controls';
    controls.innerHTML = `
        <button class="control-btn disabled"></button>
        <button class="control-btn" onclick="moveComponent('${compId}', 0, -1)">↑</button>
        <button class="control-btn disabled"></button>
        <button class="control-btn" onclick="moveComponent('${compId}', -1, 0)">←</button>
        <button class="control-btn disabled"></button>
        <button class="control-btn" onclick="moveComponent('${compId}', 1, 0)">→</button>
        <button class="control-btn disabled"></button>
        <button class="control-btn" onclick="moveComponent('${compId}', 0, 1)">↓</button>
        <button class="control-btn disabled"></button>
    `;
    return controls;
}

// Create resize controls
function createResizeControls(compId) {
    const controls = document.createElement('div');
    controls.className = 'component-controls resize-controls';

    const comp = components.find(c => c.id === compId);

    controls.innerHTML = `
        <div class="size-control">
            <label>W:</label>
            <button onclick="resizeComponent('${compId}', 'width', -1)">-</button>
            <span id="width-${compId}">${comp.width}</span>
            <button onclick="resizeComponent('${compId}', 'width', 1)">+</button>
        </div>
        <div class="size-control">
            <label>H:</label>
            <button onclick="resizeComponent('${compId}', 'height', -1)">-</button>
            <span id="height-${compId}">${comp.height}</span>
            <button onclick="resizeComponent('${compId}', 'height', 1)">+</button>
        </div>
    `;
    return controls;
}

// Update component position
function updateComponentPosition(compDiv, comp) {
    compDiv.style.left = (comp.col * unitSize) + 'px';
    compDiv.style.top = (comp.row * unitSize) + 'px';
    compDiv.style.width = (comp.width * unitSize) + 'px';
    compDiv.style.height = (comp.height * unitSize) + 'px';
}

// Update all component positions (after resize)
function updateAllComponentPositions() {
    components.forEach(comp => {
        const compDiv = document.getElementById(comp.id);
        if (compDiv) {
            updateComponentPosition(compDiv, comp);
        }
    });
}

// Move component
function moveComponent(compId, deltaCol, deltaRow) {
    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    const tabData = SPEC[currentTab];
    const newCol = comp.col + deltaCol;
    const newRow = comp.row + deltaRow;

    // Check bounds
    if (newCol >= 0 && newCol + comp.width <= tabData.columns &&
        newRow >= 0 && newRow + comp.height <= tabData.rows) {
        comp.col = newCol;
        comp.row = newRow;

        const compDiv = document.getElementById(compId);
        updateComponentPosition(compDiv, comp);
        compDiv.setAttribute('data-origin-row', comp.row);
        compDiv.setAttribute('data-origin-col', comp.col);
        bringToFront(compId);

        // Track changes and update working spec
        trackChange();
        const position = `Tab${currentTab.slice(-1)}!R${comp.row + 1}C${comp.col + 1}`;
        updateWorkingSpec(compId, { position: position });
    }
}

// Resize component
function resizeComponent(compId, dimension, delta) {
    const comp = components.find(c => c.id === compId);
    if (!comp) return;

    const tabData = SPEC[currentTab];

    if (dimension === 'width') {
        const newWidth = comp.width + delta;
        if (newWidth >= 1 && comp.col + newWidth <= tabData.columns) {
            comp.width = newWidth;
            document.getElementById(`width-${compId}`).textContent = newWidth;
        }
    } else if (dimension === 'height') {
        const newHeight = comp.height + delta;
        if (newHeight >= 1 && comp.row + newHeight <= tabData.rows) {
            comp.height = newHeight;
            document.getElementById(`height-${compId}`).textContent = newHeight;
        }
    }

    const compDiv = document.getElementById(compId);
    updateComponentPosition(compDiv, comp);
    compDiv.setAttribute('data-width', comp.width);
    compDiv.setAttribute('data-height', comp.height);

    // Track changes and update working spec
    bringToFront(compId);
    trackChange();
    updateWorkingSpec(compId, { width: comp.width, height: comp.height });
}

// Bring component to front
function bringToFront(compId) {
    const allComponents = document.querySelectorAll('.component');
    let maxZ = 10;
    allComponents.forEach(comp => {
        const z = parseInt(window.getComputedStyle(comp).zIndex) || 10;
        if (z > maxZ) maxZ = z;
    });

    const compDiv = document.getElementById(compId);
    if (compDiv) {
        compDiv.style.zIndex = maxZ + 1;
    }
}

// Select component
function selectComponent(compId) {
    // Deselect previous
    if (selectedComponentId) {
        const prev = document.getElementById(selectedComponentId);
        if (prev) prev.classList.remove('selected');
    }

    // Select new
    selectedComponentId = compId;
    const compDiv = document.getElementById(compId);
    if (compDiv) {
        compDiv.classList.add('selected');
        bringToFront(compId);
    }
}

// Switch tab
function switchTab(tabKey) {
    currentTab = tabKey;
    selectedComponentId = null;
    initializeGrid();
    loadComponents();
    renderComponents();

    // Reapply edit mode if active
    if (editMode) {
        applyEditMode(true);
    }
}

// Track changes to working spec
function trackChange() {
    hasUnsavedChanges = true;
}

// Update working spec with component changes
function updateWorkingSpec(compId, updates) {
    if (!workingSpec) return;

    const compKey = compId;
    if (workingSpec[currentTab] && workingSpec[currentTab][compKey]) {
        Object.assign(workingSpec[currentTab][compKey], updates);
        // Track this component as edited
        editedComponents.add(`${currentTab}:${compKey}`);
    }
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Copy to clipboard
function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

// Save edits
function saveEdits() {
    if (!hasUnsavedChanges || !workingSpec) {
        toggleEditModeOff();
        return;
    }

    // Apply working spec to main SPEC
    Object.assign(SPEC, JSON.parse(JSON.stringify(workingSpec)));

    // Create subset JSON with only Position, Width, and Height for EDITED components only
    const layoutSubset = {};

    // Iterate through edited components only
    editedComponents.forEach(editedKey => {
        const [tabKey, compKey] = editedKey.split(':');

        if (SPEC[tabKey] && SPEC[tabKey][compKey]) {
            const comp = SPEC[tabKey][compKey];

            // Initialize tab key in layoutSubset if not exists
            if (!layoutSubset[tabKey]) {
                layoutSubset[tabKey] = {};
            }

            // Add component with position, width, height
            if (comp.position && comp.width !== undefined && comp.height !== undefined) {
                layoutSubset[tabKey][compKey] = {
                    position: comp.position,
                    width: comp.width,
                    height: comp.height
                };
            }
        }
    });

    // Copy subset JSON to clipboard with instruction header
    const subsetString = "Edit the latest spec with the following details:\n" + JSON.stringify(layoutSubset, null, 2);
    copyToClipboard(subsetString).then(() => {
        showToast('Layout has been copied to clipboard. Please paste the layout in chat to maintain sync.');
        hasUnsavedChanges = false;
        toggleEditModeOff();
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        showToast('Failed to copy to clipboard. Please try again.');
    });
}

// Discard edits
function discardEdits() {
    if (!originalSpec) return;

    // Revert to original spec
    Object.assign(SPEC, JSON.parse(JSON.stringify(originalSpec)));
    hasUnsavedChanges = false;

    // Reload components
    loadComponents();
    renderComponents();

    toggleEditModeOff();
}

// Turn off edit mode without prompts
function toggleEditModeOff() {
    editMode = false;
    document.getElementById('editModeToggle').checked = false;
    document.getElementById('saveEditBtn').classList.remove('visible');
    applyEditMode(false);
    originalSpec = null;
    workingSpec = null;
    hasUnsavedChanges = false;
    editedComponents.clear(); // Clear the set of edited components
}

// Toggle edit mode
function toggleEditMode(enabled) {
    if (enabled) {
        // Entering edit mode
        editMode = true;
        originalSpec = JSON.parse(JSON.stringify(SPEC));
        workingSpec = JSON.parse(JSON.stringify(SPEC));
        hasUnsavedChanges = false;
        document.getElementById('saveEditBtn').classList.add('visible');
        applyEditMode(true);
    } else {
        // Exiting edit mode
        if (hasUnsavedChanges) {
            // Show alert with save/discard options
            const userChoice = confirm(
                "You have unsaved changes.\n\n" +
                "Click 'OK' to save edits and turn off edit mode.\n" +
                "Click 'Cancel' to discard edits and turn off edit mode."
            );

            if (userChoice) {
                // User chose to save
                saveEdits();
            } else {
                // User chose to discard
                discardEdits();
            }
        } else {
            // No changes, just turn off
            toggleEditModeOff();
        }
    }
}

// Apply edit mode styles
function applyEditMode(enabled) {
    const gridCanvas = document.getElementById('gridCanvas');
    const editOverlay = document.getElementById('editOverlay');
    const allComponents = document.querySelectorAll('.component');

    if (enabled) {
        gridCanvas.classList.add('visible');
        editOverlay.classList.add('visible');
        allComponents.forEach(comp => comp.classList.add('edit-mode'));
    } else {
        gridCanvas.classList.remove('visible');
        editOverlay.classList.remove('visible');
        allComponents.forEach(comp => {
            comp.classList.remove('edit-mode');
            comp.classList.remove('selected');
        });
        selectedComponentId = null;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Edit mode toggle
    document.getElementById('editModeToggle').addEventListener('change', (e) => {
        toggleEditMode(e.target.checked);
    });

    // Save edit button
    document.getElementById('saveEditBtn').addEventListener('click', () => {
        saveEdits();
    });

    // Keyboard shortcuts (only in edit mode)
    document.addEventListener('keydown', (e) => {
        if (!editMode) return;

        // Tab key to select next component
        if (e.key === 'Tab') {
            e.preventDefault();
            selectNextComponent();
            return;
        }

        if (!selectedComponentId) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                moveComponent(selectedComponentId, 0, -1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                moveComponent(selectedComponentId, 0, 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                moveComponent(selectedComponentId, -1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                moveComponent(selectedComponentId, 1, 0);
                break;
            case '7':
                e.preventDefault();
                resizeComponent(selectedComponentId, 'height', -1);
                break;
            case '8':
                e.preventDefault();
                resizeComponent(selectedComponentId, 'height', 1);
                break;
            case '9':
                e.preventDefault();
                resizeComponent(selectedComponentId, 'width', -1);
                break;
            case '0':
                e.preventDefault();
                resizeComponent(selectedComponentId, 'width', 1);
                break;
        }
    });
}

// Select next component (for Tab key)
function selectNextComponent() {
    if (components.length === 0) return;

    if (!selectedComponentId) {
        selectComponent(components[0].id);
    } else {
        const currentIndex = components.findIndex(c => c.id === selectedComponentId);
        const nextIndex = (currentIndex + 1) % components.length;
        selectComponent(components[nextIndex].id);
    }
}

// Format number with commas
function formatNumber(num) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// Initialize dashboard when DOM is ready
function initDashboard() {
    generateTabSelector();
    initializeGrid();
    loadComponents();
    renderComponents();
    setupEventListeners();
}

// Auto-initialize when script loads (if DOM is ready)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}