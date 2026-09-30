/**
 * Sound & Voice FIFO Audio Engine
 * Supports Web Audio synthesized FX, ElevenLabs Voice TTS, and Persistent MP3/WAV Local Cache
 * Saves API tokens by permanently caching generated audio in IndexedDB.
 */

const DEFAULT_ELEVENLABS_KEY = 'sk_8eb21f2966dfb9207314a348d87b6990cdbdb8e0729fde68';
const DEFAULT_JARVIS_MALE_VOICE = 'JBFqnCBsd6RMkjVDRZzb'; // George - Deep, sophisticated British Jarvis AI voice
const ELEVENLABS_KEY_STORAGE = 'ama_elevenlabs_api_key';
const ELEVENLABS_VOICE_STORAGE = 'ama_elevenlabs_voice_id';

const DB_NAME = 'ama_audio_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'cached_mp3_audio';

export const MALE_JARVIS_VOICES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Jarvis British (George - Classic AI Assistant)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Jarvis Deep (Daniel - Authoritative British Voice)' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Jarvis Executive (Adam - Deep Clear Male)' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Jarvis Resonance (Brian - Cinematic Narrative)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Jarvis Tech (Antoni - Sharp Modern Assistant)' },
];

/**
 * IndexedDB Helper for permanent offline MP3 blob storage
 */
class AudioCacheStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  public async getAudioBlob(cacheKey: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(cacheKey);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async saveAudioBlob(cacheKey: string, blob: Blob): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(blob, cacheKey);
    } catch (e) {
      console.warn('Could not cache audio blob:', e);
    }
  }
}

const audioStorage = new AudioCacheStorage();

class SoundFIFOEngine {
  private queue: (() => Promise<void>)[] = [];
  private isPlaying = false;
  private audioContext: AudioContext | null = null;
  private isUnlocked = false;

  public unlockAudio(): void {
    if (this.isUnlocked) return;
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      this.isUnlocked = true;
    } catch (e) {
      console.warn('AudioContext unlock note:', e);
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  public getElevenLabsApiKey(): string {
    const stored = localStorage.getItem(ELEVENLABS_KEY_STORAGE);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
    return DEFAULT_ELEVENLABS_KEY;
  }

  public setElevenLabsApiKey(key: string): void {
    localStorage.setItem(ELEVENLABS_KEY_STORAGE, key.trim());
  }

  public getElevenLabsVoiceId(): string {
    const stored = localStorage.getItem(ELEVENLABS_VOICE_STORAGE);
    if (stored && stored.trim().length > 0) {
      return stored.trim();
    }
    return DEFAULT_JARVIS_MALE_VOICE;
  }

  public setElevenLabsVoiceId(id: string): void {
    localStorage.setItem(ELEVENLABS_VOICE_STORAGE, id.trim());
  }

  public enqueue(task: () => Promise<void>): void {
    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isPlaying || this.queue.length === 0) return;
    this.isPlaying = true;
    const currentTask = this.queue.shift();
    if (currentTask) {
      try {
        await currentTask();
      } catch (err) {
        console.warn('Audio FIFO task failed:', err);
      }
    }
    this.isPlaying = false;
    this.processQueue();
  }

  /**
   * Play ElevenLabs Voice TTS through FIFO queue
   * Checks local IndexedDB cache first — ONLY calls ElevenLabs once per unique phrase!
   */
  public speak(text: string, onStart?: () => void): void {
    this.unlockAudio();
    const apiKey = this.getElevenLabsApiKey();
    const voiceId = this.getElevenLabsVoiceId() || DEFAULT_JARVIS_MALE_VOICE;
    const cacheKey = `mp3_v2_${voiceId}_${text.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    this.enqueue(async () => {
      try {
        // 1. Check local persistent MP3 cache first to save ElevenLabs tokens
        const cachedBlob = await audioStorage.getAudioBlob(cacheKey);
        let audioBlob = cachedBlob;

        if (!audioBlob) {
          if (apiKey) {
            // 2. Fetch from ElevenLabs once and save permanently to local cache
            const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
              },
              body: JSON.stringify({
                text,
                model_id: 'eleven_turbo_v2_5',
                voice_settings: {
                  stability: 0.65,
                  similarity_boost: 0.85,
                },
              }),
            });

            if (res.ok) {
              audioBlob = await res.blob();
              await audioStorage.saveAudioBlob(cacheKey, audioBlob);
            }
          }
        }

        if (audioBlob) {
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);

          await new Promise<void>((resolve) => {
            audio.onplay = () => onStart && onStart();
            audio.onended = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              resolve();
            };
            audio.play().catch(() => resolve());
          });
          return;
        }

        // 3. Fallback to Web Speech if no API key and no cache
        if ('speechSynthesis' in window) {
          await new Promise<void>((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 0.85;
            utterance.onstart = () => onStart && onStart();
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
          });
        }
      } catch (e) {
        console.warn('Speech playback fallback:', e);
      }
    });
  }

  /**
   * Pre-scripted audio voice routines (Cached automatically)
   */
  public playLobbyWelcome(clientName: string = 'Jeannie'): void {
    const message = `Welcome ${clientName}. Simply drop your photos anywhere into the vault. We will automatically convert, optimize, and organize them into your website folder.`;
    this.playWelcomeChime();
    this.speak(message);
  }

  public playUploadStarted(): void {
    this.playTone(600, 0.1);
    this.speak('Photos received. Converting and optimizing to website ready format.');
  }

  public playAllTasksCompleted(): void {
    this.playSuccessChime();
    this.speak('All tasks completed. Your optimized photos are stored and ready in Google Drive. Good job.');
  }

  /**
   * Futuristic Web Audio Chimes
   */
  public playTone(freq: number, duration: number = 0.15, type: OscillatorType = 'sine'): void {
    try {
      this.unlockAudio();
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  public playWelcomeChime(): void {
    this.playTone(523.25, 0.12); // C5
    setTimeout(() => this.playTone(659.25, 0.15), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.25), 200); // G5
  }

  public playSuccessChime(): void {
    this.playTone(440, 0.1);
    setTimeout(() => this.playTone(554.37, 0.1), 80);
    setTimeout(() => this.playTone(659.25, 0.12), 160);
    setTimeout(() => this.playTone(880, 0.3), 240);
  }
}

export const soundFIFO = new SoundFIFOEngine();
