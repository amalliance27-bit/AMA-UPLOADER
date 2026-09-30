/**
 * Sound & Voice FIFO Audio Engine
 * Supports Web Audio synthesized FX & ElevenLabs Voice TTS FIFO Queue
 */

const ELEVENLABS_KEY_STORAGE = 'ama_elevenlabs_api_key';
const ELEVENLABS_VOICE_STORAGE = 'ama_elevenlabs_voice_id';

class SoundFIFOEngine {
  private queue: (() => Promise<void>)[] = [];
  private isPlaying = false;
  private audioContext: AudioContext | null = null;

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
    return localStorage.getItem(ELEVENLABS_KEY_STORAGE) || '';
  }

  public setElevenLabsApiKey(key: string): void {
    localStorage.setItem(ELEVENLABS_KEY_STORAGE, key.trim());
  }

  public getElevenLabsVoiceId(): string {
    return localStorage.getItem(ELEVENLABS_VOICE_STORAGE) || '21m00Tcm4TlvDq8ikWAM'; // Default Rachel voice
  }

  public setElevenLabsVoiceId(id: string): void {
    localStorage.setItem(ELEVENLABS_VOICE_STORAGE, id.trim());
  }

  /**
   * Enqueue an audio task into the FIFO queue
   */
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
   */
  public speak(text: string): void {
    const apiKey = this.getElevenLabsApiKey();
    const voiceId = this.getElevenLabsVoiceId() || '21m00Tcm4TlvDq8ikWAM';

    if (!apiKey) {
      // Fallback to browser Web Speech Synthesis if available
      if ('speechSynthesis' in window) {
        this.enqueue(async () => {
          return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 0.95;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
          });
        });
      }
      return;
    }

    this.enqueue(async () => {
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.85,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`ElevenLabs error: ${res.statusText}`);
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);

        await new Promise<void>((resolve) => {
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
      } catch (e) {
        console.warn('ElevenLabs TTS playback error:', e);
      }
    });
  }

  /**
   * Futuristic Web Audio Chimes
   */
  public playTone(freq: number, duration: number = 0.15, type: OscillatorType = 'sine'): void {
    try {
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
