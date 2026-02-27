/**
 * SoundManager – quản lý âm thanh game dùng Web Audio API.
 * Synth âm thanh tạm thời (placeholder) – người dùng có thể đổi sang file .mp3 sau.
 * Singleton: import { sound } from './SoundManager'
 */

type SoundId =
    | 'bgm'
    | 'correct'
    | 'wrong'
    | 'tick'
    | 'tick_danger'
    | 'lifeline'
    | 'win'
    | 'lose'
    | 'walkaway'
    | 'reveal'
    | 'click';

class SoundManager {
    private _ctx: AudioContext | null = null;
    private _masterGain!: GainNode;
    private _sfxGain!: GainNode;
    private _bgmGain!: GainNode;

    private _bgmPlaying = false;

    // Volumes: 0..1
    private _masterVol = 0.7;
    private _sfxVol = 0.8;
    private _bgmVol = 0.3;
    private _sfxEnabled = true;

    private _getCtx(): AudioContext {
        if (!this._ctx) {
            this._ctx = new AudioContext();
            this._masterGain = this._ctx.createGain();
            this._sfxGain = this._ctx.createGain();
            this._bgmGain = this._ctx.createGain();

            this._sfxGain.connect(this._masterGain);
            this._bgmGain.connect(this._masterGain);
            this._masterGain.connect(this._ctx.destination);

            this._applyVolumes();
        }
        return this._ctx;
    }

    private _applyVolumes() {
        if (!this._ctx) return;
        this._masterGain.gain.setValueAtTime(this._masterVol, this._ctx.currentTime);
        this._sfxGain.gain.setValueAtTime(this._sfxEnabled ? this._sfxVol : 0, this._ctx.currentTime);
        this._bgmGain.gain.setValueAtTime(this._bgmVol, this._ctx.currentTime);
    }

    // ── Public volume setters ──────────────────────────

    setMasterVolume(v: number) {
        this._masterVol = Math.max(0, Math.min(1, v));
        this._applyVolumes();
    }

    setSFXVolume(v: number) {
        this._sfxVol = Math.max(0, Math.min(1, v));
        this._applyVolumes();
    }

    setBGMVolume(v: number) {
        this._bgmVol = Math.max(0, Math.min(1, v));
        this._applyVolumes();
        if (this._bgmVol === 0) this.stopBGM();
        else if (!this._bgmPlaying) this.playBGM();
    }

    setSFXEnabled(on: boolean) {
        this._sfxEnabled = on;
        this._applyVolumes();
    }

    get masterVolume() { return this._masterVol; }
    get sfxVolume() { return this._sfxVol; }
    get bgmVolume() { return this._bgmVol; }
    get sfxEnabled() { return this._sfxEnabled; }

    // ── BGM: ambient synth loop ────────────────────────

    playBGM() {
        if (this._bgmPlaying || this._bgmVol === 0) return;
        const ctx = this._getCtx();
        this._bgmPlaying = true;
        this._loopBGMNote(ctx);
    }

    private _loopBGMNote(ctx: AudioContext) {
        if (!this._bgmPlaying) return;
        const notes = [130.81, 146.83, 164.81, 196.00, 220.00, 196.00, 164.81, 146.83];
        let i = 0;
        const play = () => {
            if (!this._bgmPlaying) return;
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(notes[i % notes.length], ctx.currentTime);
            g.gain.setValueAtTime(0.4, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
            osc.connect(g);
            g.connect(this._bgmGain);
            osc.start();
            osc.stop(ctx.currentTime + 0.9);
            i++;
            setTimeout(play, 900);
        };
        play();
    }

    stopBGM() {
        this._bgmPlaying = false;
    }

    // ── SFX synthesis helpers ──────────────────────────

    private _playTone(
        freq: number,
        duration: number,
        type: OscillatorType = 'sine',
        gainVal = 0.5,
        gainNode?: GainNode,
    ) {
        if (!this._sfxEnabled && gainNode !== this._bgmGain) return;
        const ctx = this._getCtx();
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(gainVal, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(g);
        g.connect(gainNode ?? this._sfxGain);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    private _playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', gainVal = 0.3) {
        freqs.forEach(f => this._playTone(f, duration, type, gainVal));
    }

    // ── Named sound effects ────────────────────────────

    play(id: SoundId) {
        this._getCtx();

        switch (id) {
            case 'click':
                this._playTone(800, 0.06, 'square', 0.2);
                break;

            case 'reveal':
                // Suspenseful ascending tones
                [523, 659, 784, 1047].forEach((f, i) => {
                    setTimeout(() => this._playTone(f, 0.18, 'sine', 0.35), i * 80);
                });
                break;

            case 'correct':
                // Cheerful ascending arpeggio
                [523, 659, 784, 1047].forEach((f, i) => {
                    setTimeout(() => this._playTone(f, 0.25, 'triangle', 0.5), i * 90);
                });
                break;

            case 'wrong':
                // Descending dissonant buzz
                this._playTone(220, 0.15, 'sawtooth', 0.5);
                setTimeout(() => this._playTone(180, 0.25, 'sawtooth', 0.45), 120);
                setTimeout(() => this._playTone(140, 0.4, 'sawtooth', 0.3), 260);
                break;

            case 'tick':
                this._playTone(1200, 0.04, 'square', 0.15);
                break;

            case 'tick_danger':
                this._playTone(900, 0.06, 'square', 0.25);
                setTimeout(() => this._playTone(700, 0.08, 'square', 0.2), 70);
                break;

            case 'lifeline':
                // Quick upward sweep
                [440, 550, 660, 880].forEach((f, i) => {
                    setTimeout(() => this._playTone(f, 0.15, 'sine', 0.4), i * 60);
                });
                break;

            case 'win':
                // Triumphant fanfare
                [523, 659, 784].forEach((f, i) => {
                    setTimeout(() => this._playTone(f, 0.3, 'triangle', 0.55), i * 100);
                });
                setTimeout(() => this._playChord([523, 659, 784, 1047], 0.7, 'triangle', 0.45), 400);
                break;

            case 'lose':
                // Sad descending
                [440, 370, 330, 277].forEach((f, i) => {
                    setTimeout(() => this._playTone(f, 0.3, 'sawtooth', 0.35), i * 120);
                });
                break;

            case 'walkaway':
                // Neutral chord
                [330, 392, 494].forEach((f, i) => {
                    setTimeout(() => this._playTone(f, 0.35, 'sine', 0.3), i * 100);
                });
                break;
        }
    }
}

/** Singleton instance */
export const sound = new SoundManager();
