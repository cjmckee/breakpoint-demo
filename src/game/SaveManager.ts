/**
 * Save Manager
 * Handles saving and loading game state to localStorage
 * Can be extended to work with backend API later
 */

import {
  GameState,
  SaveData,
  SaveRequest,
  SaveResponse,
  Player,
  CurrentStatus,
} from '../types/game';

const STORAGE_KEY_PREFIX = 'tennis_rpg_save_';
const USER_ID_KEY = 'tennis_rpg_user_id';
const AUTO_SAVE_NAME = '__autosave__';

export class SaveManager {
  /**
   * Get or create user ID from localStorage/cookie
   */
  static getUserId(): string {
    // Check localStorage first
    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
      // Generate new UUID
      userId = this.generateUserId();
      localStorage.setItem(USER_ID_KEY, userId);

      // Also set cookie for persistence
      this.setCookie(USER_ID_KEY, userId, 365); // 1 year expiry
    }

    return userId;
  }

  /**
   * Save game state to localStorage
   */
  static save(
    gameState: GameState,
    saveName: string = AUTO_SAVE_NAME,
    isAutoSave: boolean = false
  ): SaveData {
    const userId = this.getUserId();
    const now = new Date().toISOString();

    const saveData: SaveData = {
      id: this.generateSaveId(),
      userId,
      name: saveName,
      gameState,
      isAutoSave,
      createdAt: now,
      updatedAt: now,
    };

    // Save to localStorage
    const key = this.getSaveKey(userId, saveData.id);
    localStorage.setItem(key, JSON.stringify(saveData));

    // Update save list
    this.updateSaveList(userId, saveData.id);

    return saveData;
  }

  /**
   * Load game state from localStorage
   */
  static load(saveId: string): GameState | null {
    const userId = this.getUserId();
    const key = this.getSaveKey(userId, saveId);

    const savedData = localStorage.getItem(key);
    if (!savedData) {
      return null;
    }

    try {
      const saveData: SaveData = JSON.parse(savedData);
      return saveData.gameState;
    } catch (error) {
      console.error('Failed to parse save data:', error);
      return null;
    }
  }

  /**
   * Get all saves for current user
   */
  static getAllSaves(): SaveData[] {
    const userId = this.getUserId();
    const saveIds = this.getSaveList(userId);

    const saves: SaveData[] = [];

    for (const saveId of saveIds) {
      const key = this.getSaveKey(userId, saveId);
      const savedData = localStorage.getItem(key);

      if (savedData) {
        try {
          saves.push(JSON.parse(savedData));
        } catch (error) {
          console.error(`Failed to parse save ${saveId}:`, error);
        }
      }
    }

    // Sort by updatedAt (newest first)
    return saves.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get most recent auto-save
   */
  static getAutoSave(): GameState | null {
    const saves = this.getAllSaves();
    const autoSave = saves.find(save => save.isAutoSave);

    return autoSave ? autoSave.gameState : null;
  }

  /**
   * Delete a save
   */
  static deleteSave(saveId: string): boolean {
    const userId = this.getUserId();
    const key = this.getSaveKey(userId, saveId);

    localStorage.removeItem(key);
    this.removeSaveFromList(userId, saveId);

    return true;
  }

  /**
   * Auto-save current game state
   */
  static autoSave(gameState: GameState): SaveData {
    return this.save(gameState, AUTO_SAVE_NAME, true);
  }

  /**
   * Check if auto-save exists
   */
  static hasAutoSave(): boolean {
    return this.getAutoSave() !== null;
  }

  /**
   * Export save as JSON string (for sharing/backup)
   */
  static exportSave(saveId: string): string | null {
    const userId = this.getUserId();
    const key = this.getSaveKey(userId, saveId);
    const savedData = localStorage.getItem(key);

    return savedData;
  }

  /**
   * Import save from JSON string
   */
  static importSave(jsonData: string): SaveData | null {
    try {
      const saveData: SaveData = JSON.parse(jsonData);

      // Update userId to current user
      const userId = this.getUserId();
      saveData.userId = userId;
      saveData.id = this.generateSaveId(); // New ID to avoid conflicts

      // Save to localStorage
      const key = this.getSaveKey(userId, saveData.id);
      localStorage.setItem(key, JSON.stringify(saveData));

      // Update save list
      this.updateSaveList(userId, saveData.id);

      return saveData;
    } catch (error) {
      console.error('Failed to import save:', error);
      return null;
    }
  }

  /**
   * Clear all saves for current user
   */
  static clearAllSaves(): void {
    const userId = this.getUserId();
    const saveIds = this.getSaveList(userId);

    for (const saveId of saveIds) {
      const key = this.getSaveKey(userId, saveId);
      localStorage.removeItem(key);
    }

    // Clear save list
    const listKey = this.getSaveListKey(userId);
    localStorage.removeItem(listKey);
  }

  /**
   * Get storage usage info
   */
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }

    // Most browsers limit localStorage to 5-10MB
    const available = 10 * 1024 * 1024; // Assume 10MB
    const percentage = (used / available) * 100;

    return { used, available, percentage };
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private static getSaveKey(userId: string, saveId: string): string {
    return `${STORAGE_KEY_PREFIX}${userId}_${saveId}`;
  }

  private static getSaveListKey(userId: string): string {
    return `${STORAGE_KEY_PREFIX}${userId}_list`;
  }

  private static getSaveList(userId: string): string[] {
    const listKey = this.getSaveListKey(userId);
    const listData = localStorage.getItem(listKey);

    if (!listData) {
      return [];
    }

    try {
      return JSON.parse(listData);
    } catch {
      return [];
    }
  }

  private static updateSaveList(userId: string, saveId: string): void {
    const list = this.getSaveList(userId);

    if (!list.includes(saveId)) {
      list.push(saveId);
      const listKey = this.getSaveListKey(userId);
      localStorage.setItem(listKey, JSON.stringify(list));
    }
  }

  private static removeSaveFromList(userId: string, saveId: string): void {
    const list = this.getSaveList(userId);
    const filtered = list.filter(id => id !== saveId);

    const listKey = this.getSaveListKey(userId);
    localStorage.setItem(listKey, JSON.stringify(filtered));
  }

  private static generateUserId(): string {
    return `user-${Date.now()}-${this.generateUUID()}`;
  }

  private static generateSaveId(): string {
    return `save-${Date.now()}-${this.generateUUID()}`;
  }

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private static setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  }

  private static getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }

    return null;
  }
}
