"use strict";
/// <reference types="@figma/plugin-typings" />
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// ================================================================================
// Core Functions
// ================================================================================
/**
 * Extract selection data from the current Figma selection.
 * Returns TEXT node data if applicable, otherwise returns 'no-text' indicator.
 */
function getSelectionPayload() {
    const selection = figma.currentPage.selection;
    if (selection.length !== 1) {
        return { kind: 'no-text' };
    }
    const node = selection[0];
    if (node.type !== 'TEXT') {
        return { kind: 'no-text' };
    }
    // Get frame width if the text node is inside a frame
    let frameWidth = null;
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
function sendSelectionToUI() {
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
function loadHistory(nodeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(nodeId);
        if (!node || node.type !== 'TEXT') {
            return [];
        }
        try {
            const historyData = node.getPluginData('writeLikeWebex:lastApplied');
            if (!historyData) {
                return [];
            }
            const history = JSON.parse(historyData);
            // Return last 3 items
            return history.slice(-3);
        }
        catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    });
}
/**
 * Save a history item to the node's pluginData.
 * Maintains a maximum of 3 history items.
 */
function saveHistory(nodeId, text) {
    return __awaiter(this, void 0, void 0, function* () {
        const node = yield figma.getNodeByIdAsync(nodeId);
        if (!node || node.type !== 'TEXT') {
            return;
        }
        try {
            const history = yield loadHistory(nodeId);
            const newItem = {
                text,
                ts: Date.now(),
                datasetVersion: 'v1.3'
            };
            history.push(newItem);
            // Keep only last 3 items
            const trimmedHistory = history.slice(-3);
            node.setPluginData('writeLikeWebex:lastApplied', JSON.stringify(trimmedHistory));
        }
        catch (error) {
            console.error('Error saving history:', error);
        }
    });
}
/**
 * Apply text to a specific node.
 * Loads required fonts, updates the text, and saves to history.
 */
function applyTextToNode(nodeId, text) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const node = yield figma.getNodeByIdAsync(nodeId);
            if (!node) {
                return { ok: false, error: 'Node not found. It may have been deleted.' };
            }
            if (node.type !== 'TEXT') {
                return { ok: false, error: 'Selected node is not a text layer.' };
            }
            // Simple approach: just load the first font we can find
            yield figma.loadFontAsync(node.fontName);
            // Update the text
            node.characters = text;
            // Save to history
            yield saveHistory(nodeId, text);
            return { ok: true };
        }
        catch (error) {
            console.error('Error applying text:', error);
            if (error instanceof Error) {
                return { ok: false, error: `Failed to apply text: ${error.message}` };
            }
            return { ok: false, error: 'An unknown error occurred while applying text.' };
        }
    });
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
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    switch (msg.type) {
        case 'GET_SELECTION':
            sendSelectionToUI();
            break;
        case 'APPLY_TEXT':
            if (msg.nodeId && msg.text !== undefined) {
                const result = yield applyTextToNode(msg.nodeId, msg.text);
                figma.ui.postMessage({
                    type: 'APPLY_RESULT',
                    ok: result.ok,
                    error: result.error
                });
            }
            break;
        case 'LOAD_HISTORY':
            if (msg.nodeId) {
                const items = yield loadHistory(msg.nodeId);
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
});
