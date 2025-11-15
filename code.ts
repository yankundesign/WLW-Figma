/// <reference types="@figma/plugin-typings" />

// Main plugin code for Write Like Webex Figma
// Handles text node selection, applies text changes, manages history, and communicates with UI.

// ================================================================================
// Type Definitions
// ================================================================================

type SelectionPayload = 
  | { kind: 'selection'; nodeId: string; nodeName: string; characters: string; count: number; autoResize: string; frameWidth: number | null }
  | { kind: 'no-text' };

interface HistoryItem {
  text: string;
  ts: number;
  datasetVersion: string;
}

interface UIMessage {
  type: string;
  nodeId?: string;
  text?: string;
  [key: string]: unknown;
}

// ================================================================================
// Core Functions
// ================================================================================

/**
 * Extract selection data from the current Figma selection.
 * Returns TEXT node data if applicable, otherwise returns 'no-text' indicator.
 */
function getSelectionPayload(): SelectionPayload {
  const selection = figma.currentPage.selection;
  
  if (selection.length !== 1) {
    return { kind: 'no-text' };
  }
  
  const node = selection[0];
  
  if (node.type !== 'TEXT') {
    return { kind: 'no-text' };
  }
  
  // Get frame width if the text node is inside a frame
  let frameWidth: number | null = null;
  if (node.parent && (node.parent.type === 'FRAME' || node.parent.type === 'COMPONENT' || node.parent.type === 'INSTANCE')) {
    frameWidth = node.parent.width;
  }
  
  return {
    kind: 'selection',
    nodeId: node.id,
    nodeName: node.name,
    characters: node.characters,
    count: node.characters.length,
    autoResize: node.textAutoResize,
    frameWidth
  };
}

/**
 * Send the current selection data to the UI.
 */
function sendSelectionToUI(): void {
  const payload = getSelectionPayload();
  figma.ui.postMessage({
    type: 'SELECTION_DATA',
    payload
  });
}

/**
 * Load history for a specific node from pluginData.
 * Returns up to 3 most recent history items.
 */
async function loadHistory(nodeId: string): Promise<HistoryItem[]> {
  const node = await figma.getNodeByIdAsync(nodeId);
  
  if (!node || node.type !== 'TEXT') {
    return [];
  }
  
  try {
    const historyData = node.getPluginData('writeLikeWebex:lastApplied');
    if (!historyData) {
      return [];
    }
    
    const history = JSON.parse(historyData) as HistoryItem[];
    // Return last 3 items
    return history.slice(-3);
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

/**
 * Save a history item to the node's pluginData.
 * Maintains a maximum of 3 history items.
 */
async function saveHistory(nodeId: string, text: string): Promise<void> {
  const node = await figma.getNodeByIdAsync(nodeId);
  
  if (!node || node.type !== 'TEXT') {
    return;
  }
  
  try {
    const history = await loadHistory(nodeId);
    
    const newItem: HistoryItem = {
      text,
      ts: Date.now(),
      datasetVersion: 'v1.3'
    };
    
    history.push(newItem);
    
    // Keep only last 3 items
    const trimmedHistory = history.slice(-3);
    
    node.setPluginData('writeLikeWebex:lastApplied', JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

/**
 * Apply text to a specific node.
 * Loads required fonts, updates the text, and saves to history.
 */
async function applyTextToNode(nodeId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    
    if (!node) {
      return { ok: false, error: 'Node not found. It may have been deleted.' };
    }
    
    if (node.type !== 'TEXT') {
      return { ok: false, error: 'Selected node is not a text layer.' };
    }
    
    // Simple approach: just load the first font we can find
    await figma.loadFontAsync(node.fontName as FontName);
    
    // Update the text
    node.characters = text;
    
    // Save to history
    await saveHistory(nodeId, text);
    
    return { ok: true };
  } catch (error) {
    console.error('Error applying text:', error);
    
    if (error instanceof Error) {
      return { ok: false, error: `Failed to apply text: ${error.message}` };
    }
    
    return { ok: false, error: 'An unknown error occurred while applying text.' };
  }
}

// ================================================================================
// Plugin Initialization
// ================================================================================

// Show the UI
figma.showUI(__html__, { width: 360, height: 600 });

// Send initial selection data
sendSelectionToUI();

// Listen for selection changes
figma.on('selectionchange', () => {
  sendSelectionToUI();
});

// ================================================================================
// Message Handler
// ================================================================================

figma.ui.onmessage = async (msg: UIMessage) => {
  switch (msg.type) {
    case 'GET_SELECTION':
      sendSelectionToUI();
      break;
      
    case 'APPLY_TEXT':
      if (msg.nodeId && msg.text !== undefined) {
        const result = await applyTextToNode(msg.nodeId, msg.text);
        figma.ui.postMessage({
          type: 'APPLY_RESULT',
          ok: result.ok,
          error: result.error
        });
      }
      break;
      
    case 'LOAD_HISTORY':
      if (msg.nodeId) {
        const items = await loadHistory(msg.nodeId);
        figma.ui.postMessage({
          type: 'HISTORY_DATA',
          payload: { items }
        });
      }
      break;
      
    case 'REQUEST_UNDO':
      // Note: Figma plugin API doesn't support programmatic undo
      // Users can still use Cmd+Z / Ctrl+Z to undo
      figma.ui.postMessage({
        type: 'UNDO_NOT_SUPPORTED',
        message: 'Please use Cmd+Z (Mac) or Ctrl+Z (Windows) to undo'
      });
      break;
      
    default:
      console.warn('Unknown message type:', msg.type);
  }
};
