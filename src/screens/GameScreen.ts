import { Assets, Container, Graphics, Sprite, Text, Ticker } from 'pixi.js';
import { AppScreen } from '../components/basic/AppScreen';
import { defaultFont, dialogFont } from '../config/texts';
import { game, SceneData } from '../Game';
import { TitleScreen } from './TitleScreen';
import { Windows } from '../config/windows';
import { PRIZES, SAFE_MILESTONES, QUESTIONS, Question } from '../config/questions';
import { loadQuestionsForGame, seedQuestions } from '../services/questionService';
import { sound } from '../services/SoundManager';
import gsap from 'gsap';

// Expose seedQuestions to browser console for one-time data seeding
(window as any).seedQuestions = seedQuestions;

/* ─────────────────────────────────────────────
   Constants & palette
   ───────────────────────────────────────────── */
const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

// Time in seconds per question
const QUESTION_TIME = 30;

// Game state enum
enum GameState {
    IDLE,
    QUESTION,
    REVEAL,
    CORRECT,
    WRONG,
    LIFELINE_5050,
    LIFELINE_PHONE,
    LIFELINE_AUDIENCE,
    WIN,
    LOSE,
    WALKAWAY,
}

/* ─────────────────────────────────────────────
   Colour palette (millionaire show style)
   ───────────────────────────────────────────── */
const C = {
    bg: 0x04012b,          // deep navy
    panel: 0x0a0550,       // slightly lighter navy
    answerDefault: 0x0d1b8e,  // blue
    answerDefaultBorder: 0x3b6dff,
    answerHover: 0x1a3ab5,
    answerCorrect: 0x1a7a2a,
    answerCorrectBorder: 0x2dff4e,
    answerWrong: 0x8b0000,
    answerWrongBorder: 0xff2222,
    answerEliminated: 0x1a1a3a,
    answerEliminatedBorder: 0x2a2a5a,
    text: 0xffffff,
    gold: 0xffd700,
    safeMilestone: 0x7fff00,
    timerBg: 0x111155,
    timerFill: 0x00d4ff,
    timerWarning: 0xff8800,
    timerDanger: 0xff2222,
    lifelineActive: 0x0d1b8e,
    lifelineUsed: 0x2a2a3a,
    lifelineActiveBorder: 0xffd700,
    lifelineUsedBorder: 0x444444,
    ribbonBg: 0x080430,
};

/* ─────────────────────────────────────────────
   Helper to draw a rounded rectangle shape
   ───────────────────────────────────────────── */
function drawRoundRect(
    g: Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fillColor: number,
    strokeColor?: number,
    strokeWidth = 2,
    alpha = 1,
) {
    if (strokeColor !== undefined) {
        g.setStrokeStyle({ width: strokeWidth, color: strokeColor, alpha });
    }
    g.roundRect(x, y, w, h, r);
    g.fill({ color: fillColor, alpha });
    if (strokeColor !== undefined) {
        g.stroke();
    }
}

/* ─────────────────────────────────────────────
   AnswerButton – a single answer tile
   ───────────────────────────────────────────── */
class AnswerButton extends Container {
    private bg: Graphics;
    private _labelText: Text;
    private _index: number;
    private _eliminated = false;
    private _state: 'default' | 'correct' | 'wrong' | 'eliminated' = 'default';
    private _onclick: (idx: number) => void;
    private _w: number;
    private _h: number;

    constructor(
        index: number,
        text: string,
        w: number,
        h: number,
        onclick: (idx: number) => void,
    ) {
        super();
        this._index = index;
        this._onclick = onclick;
        this._w = w;
        this._h = h;

        this.bg = new Graphics();
        this.addChild(this.bg);

        this._labelText = new Text({
            text: `${ANSWER_LABELS[index]}: ${text}`,
            style: {
                fill: C.text,
                fontSize: 22,
                fontFamily: dialogFont,
                fontWeight: 'bold',
                wordWrap: true,
                wordWrapWidth: w - 30,
                align: 'center',
            },
        });
        this._labelText.anchor.set(0, 0.5);
        this._labelText.x = 50;
        this._labelText.y = h / 2;
        this.addChild(this._labelText);

        this.drawState();
        this.setInteractive(true);
    }

    private drawState() {
        this.bg.clear();
        let fill = C.answerDefault;
        let border = C.answerDefaultBorder;

        if (this._state === 'correct') {
            fill = C.answerCorrect;
            border = C.answerCorrectBorder;
        } else if (this._state === 'wrong') {
            fill = C.answerWrong;
            border = C.answerWrongBorder;
        } else if (this._state === 'eliminated') {
            fill = C.answerEliminated;
            border = C.answerEliminatedBorder;
        }

        drawRoundRect(this.bg, 0, 0, this._w, this._h, 24, fill, border, 2.5);
    }

    setInteractive(on: boolean) {
        this.eventMode = on && !this._eliminated && this._state === 'default' ? 'static' : 'none';
        this.cursor = on ? 'pointer' : 'default';

        this.on('pointerover', this._onHover.bind(this));
        this.on('pointerout', this._onOut.bind(this));
        this.on('pointertap', this._onTap.bind(this));
    }

    private _onHover() {
        if (this._state !== 'default') return;
        this.bg.clear();
        drawRoundRect(this.bg, 0, 0, this._w, this._h, 24, C.answerHover, C.answerDefaultBorder, 2.5);
    }

    private _onOut() {
        if (this._state !== 'default') return;
        this.drawState();
    }

    private _onTap() {
        if (this._state !== 'default') return;
        this._onclick(this._index);
    }

    markCorrect() {
        this._state = 'correct';
        this.eventMode = 'none';
        this.drawState();
        // Nhấp nháy alpha ~2 giây (10 vòng × 0.1s × 2 chiều = 2s)
        gsap.fromTo(this, { alpha: 1 }, { alpha: 0.35, yoyo: true, repeat: 9, duration: 0.1, ease: 'none' });
    }

    markWrong() {
        this._state = 'wrong';
        this.eventMode = 'none';
        this.drawState();
    }

    markEliminated() {
        this._state = 'eliminated';
        this._eliminated = true;
        this.eventMode = 'none';
        this._labelText.alpha = 0.35;
        this.drawState();
    }

    reset(text: string) {
        this._state = 'default';
        this._eliminated = false;
        this._labelText.text = `${ANSWER_LABELS[this._index]}: ${text}`;
        this._labelText.alpha = 1;
        this.scale.set(1);
        this.drawState();
        this.setInteractive(true);
    }

    get eliminated() { return this._eliminated; }
}

/* ─────────────────────────────────────────────
   CircularTimer
   ───────────────────────────────────────────── */
class CircularTimer extends Container {
    private arc: Graphics;
    private _timerLabel: Text;
    private _radius: number;

    constructor(radius = 42) {
        super();
        this._radius = radius;

        // BG circle
        const bg = new Graphics();
        bg.circle(0, 0, radius + 4);
        bg.fill({ color: C.timerBg });
        bg.stroke({ width: 3, color: 0x111155 });
        this.addChild(bg);

        this.arc = new Graphics();
        this.addChild(this.arc);

        this._timerLabel = new Text({
            text: '30',
            style: {
                fill: C.text,
                fontSize: radius * 0.88,
                fontFamily: defaultFont,
                fontWeight: 'bold',
            },
        });
        this._timerLabel.anchor.set(0.5);
        this.addChild(this._timerLabel);

        this.update(1, 30);
    }

    /** progress 0..1, seconds remaining */
    update(progress: number, seconds: number) {
        this.arc.clear();

        const color = progress > 0.5 ? C.timerFill : progress > 0.25 ? C.timerWarning : C.timerDanger;
        const r = this._radius;
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + progress * Math.PI * 2;

        this.arc.moveTo(0, 0);
        this.arc.arc(0, 0, r, startAngle, endAngle);
        this.arc.closePath();
        this.arc.fill({ color, alpha: 0.85 });
        this.arc.stroke({ width: 3, color });

        this._timerLabel.text = `${Math.ceil(seconds)}`;
        this._timerLabel.style.fill = color;
    }
}

/* ─────────────────────────────────────────────
   PrizeLadder – right-side prize ribbon
   ───────────────────────────────────────────── */
class PrizeLadder extends Container {
    private rows: Container[] = [];
    private _w: number;
    private _rowH: number;

    constructor(w: number, h: number) {
        super();
        this._w = w;
        this._rowH = h / 15;
        const rowH = this._rowH;

        // ── Overall background panel ──
        const panelBg = new Graphics();
        panelBg.roundRect(0, 0, w, h, 8);
        panelBg.fill({ color: 0x04012b, alpha: 1 });
        panelBg.stroke({ width: 1.5, color: 0x1a1a5a });
        this.addChild(panelBg);

        for (let i = 14; i >= 0; i--) {
            const row = new Container();
            const dispIndex = 14 - i; // visual position (top = question 15, bottom = 1)
            row.y = dispIndex * rowH;

            const isMilestone = SAFE_MILESTONES.includes(i);
            const bg = new Graphics();
            const fillColor = isMilestone ? 0x1a1200 : 0x06024a;
            const borderColor = isMilestone ? C.gold : 0x1a1a6a;
            drawRoundRect(bg, 0, 0, w, rowH - 2, 4, fillColor, borderColor, isMilestone ? 2 : 1);
            row.addChild(bg);

            const numLabel = new Text({
                text: `${i + 1}`,
                style: {
                    fill: isMilestone ? C.gold : 0x8888cc,
                    fontSize: rowH * 0.42,
                    fontFamily: defaultFont,
                    fontWeight: 'bold',
                },
            });
            numLabel.anchor.set(0, 0.5);
            numLabel.x = 8;
            numLabel.y = rowH / 2 - 1;
            row.addChild(numLabel);

            const prizeLabel = new Text({
                text: PRIZES[i],
                style: {
                    fill: isMilestone ? C.gold : C.text,
                    fontSize: rowH * 0.38,
                    fontFamily: defaultFont,
                    fontWeight: isMilestone ? 'bold' : 'normal',
                    align: 'right',
                },
            });
            prizeLabel.anchor.set(1, 0.5);
            prizeLabel.x = w - 6;
            prizeLabel.y = rowH / 2 - 1;
            row.addChild(prizeLabel);

            this.rows.push({ questionIndex: i, container: row } as any);
            this.addChild(row);
        }
    }

    highlight(questionIndex: number) {
        const w = this._w;
        const rowH = this._rowH;

        this.rows.forEach((r: any) => {
            const { questionIndex: qi, container } = r;
            const isMilestone = SAFE_MILESTONES.includes(qi);
            const bg = container.children[0] as Graphics;
            bg.clear();

            if (qi === questionIndex) {
                // Current question: bright gold highlight filling the row
                drawRoundRect(bg, 0, 0, w, rowH - 2, 4, 0xcf8c00, C.gold, 2.5);
                (container.children[1] as Text).style.fill = 0x000000;
                (container.children[2] as Text).style.fill = 0x000000;
            } else {
                const fillColor = isMilestone ? 0x1a1200 : 0x06024a;
                const borderColor = isMilestone ? C.gold : 0x1a1a6a;
                drawRoundRect(bg, 0, 0, w, rowH - 2, 4, fillColor, borderColor, isMilestone ? 2 : 1);
                (container.children[1] as Text).style.fill = isMilestone ? C.gold : 0x8888cc;
                (container.children[2] as Text).style.fill = isMilestone ? C.gold : C.text;
            }
        });
    }
}

/* ─────────────────────────────────────────────
   LifelineButton
   ───────────────────────────────────────────── */
class LifelineButton extends Container {
    private bg: Graphics;
    private _labelText: Text;
    private _used = false;
    private _w: number;
    private _h: number;

    constructor(label: string, w: number, h: number, onclick: () => void) {
        super();
        this._w = w;
        this._h = h;

        this.bg = new Graphics();
        this.addChild(this.bg);

        this._labelText = new Text({
            text: label,
            style: {
                fill: C.text,
                fontSize: 20,
                fontFamily: dialogFont,
                fontWeight: 'bold',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: w - 10,
            },
        });
        this._labelText.anchor.set(0.5);
        this._labelText.x = w / 2;
        this._labelText.y = h / 2;
        this.addChild(this._labelText);

        this.draw(false);
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.on('pointertap', () => { if (!this._used) onclick(); });
        this.on('pointerover', () => {
            if (!this._used) gsap.to(this.scale, { x: 1.06, y: 1.06, duration: 0.1 });
        });
        this.on('pointerout', () => {
            gsap.to(this.scale, { x: 1, y: 1, duration: 0.1 });
        });
    }

    private draw(used: boolean) {
        this.bg.clear();
        const fill = used ? C.lifelineUsed : C.lifelineActive;
        const border = used ? C.lifelineUsedBorder : C.lifelineActiveBorder;
        drawRoundRect(this.bg, 0, 0, this._w, this._h, this._h / 2, fill, border, used ? 1 : 2);
    }

    markUsed() {
        this._used = true;
        this._labelText.alpha = 0.3;
        this.draw(true);
        this.eventMode = 'none';
        this.cursor = 'default';
    }

    reset() {
        this._used = false;
        this._labelText.alpha = 1;
        this.draw(false);
        this.eventMode = 'static';
        this.cursor = 'pointer';
    }

    get used() { return this._used; }
}

/* ─────────────────────────────────────────────
   OverlayPanel – for phone/audience popups
   ───────────────────────────────────────────── */
class OverlayPanel extends Container {
    constructor(title: string, bodyText: string, w: number, h: number, onClose: () => void) {
        super();

        const bg = new Graphics();
        bg.roundRect(0, 0, w, h, 18);
        bg.fill({ color: 0x0a0550, alpha: 0.97 });
        bg.stroke({ width: 3, color: C.gold });
        this.addChild(bg);

        const titleEl = new Text({
            text: title,
            style: {
                fill: C.gold,
                fontSize: 22,
                fontFamily: defaultFont,
                fontWeight: 'bold',
                align: 'center',
            },
        });
        titleEl.anchor.set(0.5, 0);
        titleEl.x = w / 2;
        titleEl.y = 18;
        this.addChild(titleEl);

        const bodyEl = new Text({
            text: bodyText,
            style: {
                fill: C.text,
                fontSize: 17,
                fontFamily: defaultFont,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: w - 40,
            },
        });
        bodyEl.anchor.set(0.5, 0);
        bodyEl.x = w / 2;
        bodyEl.y = 60;
        this.addChild(bodyEl);

        // Close button
        const closeBg = new Graphics();
        closeBg.roundRect(0, 0, 100, 36, 12);
        closeBg.fill({ color: 0x8b0000 });
        closeBg.stroke({ width: 2, color: 0xff4444 });

        const closeLabel = new Text({ text: 'Đóng', style: { fill: C.text, fontSize: 16, fontFamily: defaultFont } });
        closeLabel.anchor.set(0.5);
        closeLabel.x = 50;
        closeLabel.y = 18;

        const closeBtn = new Container();
        closeBtn.addChild(closeBg, closeLabel);
        closeBtn.x = (w - 100) / 2;
        closeBtn.y = h - 52;
        closeBtn.eventMode = 'static';
        closeBtn.cursor = 'pointer';
        closeBtn.on('pointertap', onClose);
        this.addChild(closeBtn);
    }
}

/* ─────────────────────────────────────────────
   Main GameScreen
   ───────────────────────────────────────────── */
export class GameScreen extends AppScreen {
    public static assetBundles = ['game'];

    // Layout refs
    private mainContainer!: Container;
    private questionPanel!: Container;
    private questionText!: Text;
    private answerButtons: AnswerButton[] = [];
    private prizeLadder!: PrizeLadder;
    private timer!: CircularTimer;
    private lifelineContainer!: Container;
    private lifelines: LifelineButton[] = [];
    private statusText!: Text;
    private _statusBg!: Graphics;
    private overlay!: Container;  // dim layer
    private popupContainer!: Container;
    private prizeDisplay!: Text;

    // Game state
    private _questions: Question[] = [...QUESTIONS];
    private _state: GameState = GameState.IDLE;
    private _questionIndex = 0;
    private _timeLeft = QUESTION_TIME;
    private _timerRunning = false;
    private _lifelineUsed = [false, false, false];
    private _screenW = 800;
    private _screenH = 600;
    private _lastTickSec = -1; // for tick sound per-second tracking

    constructor(_options?: SceneData) {
        super('GameScreen');
        this._buildUI(800, 600);
        if (_options?.questions && _options.questions.length === 15) {
            // Questions pre-loaded by LoadingScreen — start immediately
            this._questions = _options.questions;
            this._loadQuestion();
        } else {
            // Fallback: fetch in-screen (e.g. direct URL navigation)
            this._fetchAndStart();
        }
    }

    /** Async fallback: load questions from Firestore then start */
    private async _fetchAndStart() {
        this._setStatus('⏳ Đang tải câu hỏi...');
        try {
            this._questions = await loadQuestionsForGame();
        } catch {
            this._questions = [...QUESTIONS];
        }
        this._setStatus('');
        this._loadQuestion();
    }


    /* ──────────── Build entire UI ──────────── */
    private _setStatus(msg: string) {
        if (!this.statusText) return;
        this.statusText.text = msg;
        if (!this._statusBg) return;
        this._statusBg.clear();
        if (!msg) return;
        // anchor=(1,1): text spans [x - width .. x] horizontally, [y - height .. y] vertically
        // Add equal padding (10px) on all sides
        const padX = 10, padY = 6;
        const tw = this.statusText.width;
        const th = this.statusText.height;
        this._statusBg.roundRect(
            this.statusText.x - tw - padX,  // left edge with padding
            this.statusText.y - th - padY,  // top edge with padding
            tw + padX * 2,
            th + padY * 2,
            10,
        );
        this._statusBg.fill({ color: 0x000000, alpha: 0.65 });
        this._statusBg.stroke({ width: 2, color: C.gold });
    }
    private _buildUI(w: number, h: number) {
        this._screenW = w;
        this._screenH = h;

        // Remove old content if any
        if (this.mainContainer) {
            this.removeChild(this.mainContainer);
        }

        this.mainContainer = new Container();
        this.addChild(this.mainContainer);

        // Background image
        this._drawBackground(w, h);

        const isMobile = w < 600;
        if (isMobile) {
            this._buildMobileLayout(w, h);
        } else {
            this._buildDesktopLayout(w, h);
        }
    }

    private _drawBackground(w: number, h: number) {
        const texture = Assets.get('bg_ailaphu');
        if (texture) {
            const bg = new Sprite(texture);
            bg.width = w;
            bg.height = h;
            this.mainContainer.addChild(bg);
        } else {
            // Fallback: solid dark navy
            const bg = new Graphics();
            bg.rect(0, 0, w, h);
            bg.fill({ color: C.bg });
            this.mainContainer.addChild(bg);
        }
    }

    private _buildDesktopLayout(w: number, h: number) {
        const ladderW = Math.min(200, w * 0.22) + 50;
        const centerW = w - ladderW;  // no gap
        const pad = 14;

        // ── Title bar ──
        const titleBar = new Graphics();
        titleBar.roundRect(0, 0, centerW, 90, 0);
        titleBar.fill({ color: C.ribbonBg, alpha: 0.85 });
        titleBar.x = 0;
        titleBar.y = 0;
        this.mainContainer.addChild(titleBar);

        const titleText = new Text({
            text: 'AI LÀ PHÚ',
            style: {
                fill: C.gold,
                fontSize: 50,
                fontFamily: defaultFont,
                fontWeight: 'bold',
                stroke: { color: 0x000000, width: 4 },
            },
        });
        titleText.anchor.set(0.5, 0.5);
        titleText.x = centerW / 2;
        titleText.y = 40;
        this.mainContainer.addChild(titleText);

        // ── Timer ──
        this.timer = new CircularTimer(32);
        this.timer.x = centerW - 44;
        this.timer.y = 40;
        this.mainContainer.addChild(this.timer);

        // Pause button (home)
        const pauseG = new Graphics();
        pauseG.roundRect(0, 0, 50, 50, 6);
        pauseG.fill({ color: 0x1a0033 });
        pauseG.stroke({ width: 1.5, color: 0xaaaaff });
        const pauseLabel = new Text({ text: '🏠︎', style: { fill: C.text, fontSize: 32 } });
        pauseLabel.anchor.set(0.5);
        pauseLabel.x = 25; pauseLabel.y = 25;
        const pauseBtn = new Container();
        pauseBtn.addChild(pauseG, pauseLabel);
        pauseBtn.x = 8; pauseBtn.y = 18;
        pauseBtn.eventMode = 'static';
        pauseBtn.cursor = 'pointer';
        pauseBtn.on('pointertap', () => this._onPause());
        this.mainContainer.addChild(pauseBtn);

        // ── Prize display ──
        this.prizeDisplay = new Text({
            text: 'Giải thưởng: --',
            style: { fill: C.gold, fontSize: 15, fontFamily: defaultFont, fontWeight: 'bold' },
        });
        this.prizeDisplay.anchor.set(0.5, 0.5);
        this.prizeDisplay.x = centerW / 2;
        this.prizeDisplay.y = 38;
        // Will reposition after

        // ── Lifelines ──
        const lifelineY = 100;
        const llW = 90;
        const llH = 40;
        const llGap = 12;
        const llTotalW = 3 * llW + 2 * llGap;
        const llStartX = w - llTotalW - 300;
        this.lifelineContainer = new Container();
        this.lifelineContainer.y = lifelineY;
        this.mainContainer.addChild(this.lifelineContainer);

        const lifelineLabels = ['50:50', '📞 Gọi', '🙋 Hỏi'];
        this.lifelines = [];
        lifelineLabels.forEach((lbl, i) => {
            const btn = new LifelineButton(lbl, llW, llH, () => this._useLifeline(i));
            btn.x = llStartX + i * (llW + llGap);
            btn.y = 0;
            this.lifelineContainer.addChild(btn);
            this.lifelines.push(btn);
        });

        // ── Question panel ──
        const qPanelY = lifelineY + llH + pad + 300;
        const qPanelH = Math.min(110, h * 0.2);
        this.questionPanel = new Container();
        this.questionPanel.x = 100;
        this.questionPanel.y = qPanelY;
        this.mainContainer.addChild(this.questionPanel);

        const qBg = new Graphics();
        qBg.roundRect(0, 0, centerW - 200, qPanelH, 24);
        qBg.fill({ color: C.panel, alpha: 0.9 });
        qBg.stroke({ width: 2, color: 0x3333aa });
        this.questionPanel.addChild(qBg);

        this.questionText = new Text({
            text: '',
            style: {
                fill: C.text,
                fontSize: 20,
                fontFamily: dialogFont,
                fontWeight: 'bold',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: centerW - 30,
            },
        });
        this.questionText.anchor.set(0.5);
        this.questionText.x = centerW / 2;
        this.questionText.y = qPanelH / 2;
        this.questionPanel.addChild(this.questionText);

        // ── Answer buttons (2x2 grid) ──
        // Match question panel: x = 100, total width = centerW - 200
        const qPanelX = 100;
        const qPanelW = centerW - 200;
        const answersY = qPanelY + qPanelH + pad;
        const aBtnW = (qPanelW - pad) / 2;
        const aBtnH = Math.min(62, (h - answersY - 50) / 2 - pad);
        this.answerButtons = [];

        for (let i = 0; i < 4; i++) {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const btn = new AnswerButton(i, '', aBtnW, aBtnH, (idx) => this._onAnswer(idx));
            btn.x = qPanelX + col * (aBtnW + pad);
            btn.y = answersY + row * (aBtnH + 10);
            this.mainContainer.addChild(btn);
            this.answerButtons.push(btn);
        }

        this._statusBg = new Graphics();

        this.statusText = new Text({
            text: '',
            style: {
                fill: 0xffffff,
                fontSize: 24,
                fontFamily: defaultFont,
                fontWeight: 'bold',
                align: 'right',
            },
        });
        this.statusText.anchor.set(1, 1); // right-bottom anchor
        this.statusText.x = qPanelX + qPanelW; // flush right edge of question box
        this.statusText.y = qPanelY - 20;        // above the question box

        this.mainContainer.addChild(this._statusBg);
        this.mainContainer.addChild(this.statusText);


        // Walk away button
        const walkBg = new Graphics();
        walkBg.roundRect(0, 0, 150, 40, 10);
        walkBg.fill({ color: 0x400000 });
        walkBg.stroke({ width: 2, color: 0xee4444 });
        const walkLabel = new Text({ text: '💸 Dừng cuộc chơi', style: { fill: C.text, fontSize: 18, fontFamily: defaultFont } });
        walkLabel.anchor.set(0.5);
        walkLabel.x = 75; walkLabel.y = 20;
        const walkBtn = new Container();
        walkBtn.addChild(walkBg, walkLabel);
        walkBtn.x = centerW - 160;  // left of prize ladder
        walkBtn.y = h - 50;          // bottom of screen
        walkBtn.eventMode = 'static';
        walkBtn.cursor = 'pointer';
        walkBtn.on('pointertap', () => this._onWalkAway());
        this.mainContainer.addChild(walkBtn);

        // ── Prize Ladder (right) ──
        const ladderX = centerW;   // flush against centerW, no gap
        const ladderH = h;          // fill full height
        this.prizeLadder = new PrizeLadder(ladderW, ladderH);
        this.prizeLadder.x = ladderX;
        this.prizeLadder.y = 0;
        this.mainContainer.addChild(this.prizeLadder);

        // ── Overlay & popup ──
        this.overlay = new Container();
        this.overlay.visible = false;
        const dimRect = new Graphics();
        dimRect.rect(0, 0, w, h);
        dimRect.fill({ color: 0x000000, alpha: 0.6 });
        this.overlay.addChild(dimRect);
        this.addChild(this.overlay);

        this.popupContainer = new Container();
        this.popupContainer.visible = false;
        this.addChild(this.popupContainer);
    }

    private _buildMobileLayout(w: number, h: number) {
        // Simplified vertical stack for narrow screens
        const pad = 8;
        let curY = 0;

        // Title
        const titleText = new Text({
            text: 'AI LÀ TRIỆU PHÚ',
            style: { fill: C.gold, fontSize: 20, fontFamily: defaultFont, fontWeight: 'bold' },
        });
        titleText.anchor.set(0.5, 0);
        titleText.x = w / 2;
        titleText.y = curY;
        this.mainContainer.addChild(titleText);
        curY += 28;

        // Timer
        this.timer = new CircularTimer(24);
        this.timer.x = w - 34;
        this.timer.y = 12;
        this.mainContainer.addChild(this.timer);

        // Lifelines
        const llW = (w - pad * 4) / 3;
        const llH = 28;
        this.lifelineContainer = new Container();
        this.lifelineContainer.y = curY;
        this.mainContainer.addChild(this.lifelineContainer);
        this.lifelines = [];
        ['50:50', '📞', '🙋'].forEach((lbl, i) => {
            const btn = new LifelineButton(lbl, llW, llH, () => this._useLifeline(i));
            btn.x = pad + i * (llW + pad);
            this.lifelineContainer.addChild(btn);
            this.lifelines.push(btn);
        });
        curY += llH + pad;

        // Question panel
        const qH = 90;
        this.questionPanel = new Container();
        this.questionPanel.y = curY;
        this.mainContainer.addChild(this.questionPanel);
        const qBg = new Graphics();
        qBg.roundRect(0, 0, w, qH, 12);
        qBg.fill({ color: C.panel, alpha: 0.9 });
        qBg.stroke({ width: 2, color: 0x3333aa });
        this.questionPanel.addChild(qBg);
        this.questionText = new Text({
            text: '',
            style: { fill: C.text, fontSize: 15, fontFamily: defaultFont, align: 'center', wordWrap: true, wordWrapWidth: w - 20 },
        });
        this.questionText.anchor.set(0.5);
        this.questionText.x = w / 2;
        this.questionText.y = qH / 2;
        this.questionPanel.addChild(this.questionText);
        curY += qH + pad;

        // Answers (stacked vertically)
        const aBtnH = 46;
        this.answerButtons = [];
        for (let i = 0; i < 4; i++) {
            const btn = new AnswerButton(i, '', w, aBtnH, (idx) => this._onAnswer(idx));
            btn.y = curY + i * (aBtnH + 6);
            this.mainContainer.addChild(btn);
            this.answerButtons.push(btn);
        }
        curY += 4 * (aBtnH + 6) + pad;

        // Status
        this.statusText = new Text({
            text: '',
            style: { fill: C.gold, fontSize: 15, fontFamily: defaultFont, align: 'center' },
        });
        this.statusText.anchor.set(0.5, 0);
        this.statusText.x = w / 2;
        this.statusText.y = curY;
        this.mainContainer.addChild(this.statusText);

        // Current prize display (small)
        this.prizeDisplay = new Text({
            text: '',
            style: { fill: C.gold, fontSize: 13, fontFamily: defaultFont },
        });
        this.prizeDisplay.anchor.set(0.5, 0);
        this.prizeDisplay.x = w / 2;
        this.prizeDisplay.y = curY + 24;
        this.mainContainer.addChild(this.prizeDisplay);

        // Overlay
        this.overlay = new Container();
        this.overlay.visible = false;
        const dimRect = new Graphics();
        dimRect.rect(0, 0, w, h);
        dimRect.fill({ color: 0x000000, alpha: 0.6 });
        this.overlay.addChild(dimRect);
        this.addChild(this.overlay);

        this.popupContainer = new Container();
        this.popupContainer.visible = false;
        this.addChild(this.popupContainer);
    }

    /* ──────────── Load / display a question ──────────── */
    private _loadQuestion() {
        const q: Question = this._questions[this._questionIndex];
        this.questionText.text = `Câu ${this._questionIndex + 1}: ${q.question}`;

        this.answerButtons.forEach((btn, i) => {
            btn.reset(q.answers[i]);
        });

        if (this.prizeLadder) {
            this._tryHighlightLadder();
        }

        if (this.prizeDisplay) {
            this.prizeDisplay.text = this._questionIndex > 0
                ? `An toàn: ${PRIZES[this._getSafePrize()]}`
                : '';
        }

        this._setStatus('');
        this._state = GameState.QUESTION;
        sound.playBGM();    // start background music
        this._startTimer();
    }

    private _tryHighlightLadder() {
        if (this.prizeLadder && this.prizeLadder.height > 0) {
            this.prizeLadder.highlight(this._questionIndex);
        }
    }

    private _getSafePrize(): number {
        // Find the highest passed safe milestone
        for (let i = SAFE_MILESTONES.length - 1; i >= 0; i--) {
            if (this._questionIndex > SAFE_MILESTONES[i]) {
                return SAFE_MILESTONES[i];
            }
        }
        return -1; // no safe prize yet
    }

    /* ──────────── Timer ──────────── */
    private _startTimer() {
        this._timeLeft = QUESTION_TIME;
        this._timerRunning = true;
        this.timer.update(1, QUESTION_TIME);
    }

    private _stopTimer() {
        this._timerRunning = false;
    }

    public onUpdate(ticker: Ticker) {
        if (!this._timerRunning || this._state !== GameState.QUESTION) return;

        this._timeLeft -= ticker.deltaMS / 1000;

        if (this._timeLeft <= 0) {
            this._timeLeft = 0;
            this._stopTimer();
            this.timer.update(0, 0);
            this._onTimeUp();
            return;
        }

        this.timer.update(this._timeLeft / QUESTION_TIME, this._timeLeft);

        // Play tick sound once per second
        const secs = Math.ceil(this._timeLeft);
        if (secs !== this._lastTickSec) {
            this._lastTickSec = secs;
            sound.play(this._timeLeft <= 10 ? 'tick_danger' : 'tick');
        }
    }

    private _onTimeUp() {
        this._state = GameState.LOSE;
        this._setStatus('⏰ Hết giờ!');
        sound.play('lose');
        const correct = this._questions[this._questionIndex].correct;
        this.answerButtons[correct].markCorrect();
        setTimeout(() => this._showResult(false), 2000);
    }

    /* ──────────── Answer selection ──────────── */
    private _onAnswer(idx: number) {
        if (this._state !== GameState.QUESTION) return;
        this._stopTimer();
        this._state = GameState.REVEAL;
        sound.play('reveal');

        const correct = this._questions[this._questionIndex].correct;
        const isCorrect = idx === correct;

        setTimeout(() => {
            if (isCorrect) {
                this.answerButtons[idx].markCorrect();
                this._state = GameState.CORRECT;
                this._setStatus('✅ Chính xác!');
                sound.play('correct');
                setTimeout(() => this._advanceQuestion(), 1800);
            } else {
                this.answerButtons[idx].markWrong();
                this.answerButtons[correct].markCorrect();
                this._state = GameState.WRONG;
                this._setStatus('❌ Sai rồi!');
                sound.play('wrong');
                setTimeout(() => this._showResult(false), 2000);
            }
        }, 800);
    }

    private _advanceQuestion() {
        if (this._questionIndex >= 14) {
            // Won!
            this._showResult(true);
            return;
        }
        this._questionIndex++;
        this._loadQuestion();
    }

    /* ──────────── Lifelines ──────────── */
    private _useLifeline(index: number) {
        if (this._state !== GameState.QUESTION) return;
        if (this._lifelineUsed[index]) return;
        this._lifelineUsed[index] = true;
        this.lifelines[index].markUsed();
        this._stopTimer();
        sound.play('lifeline');

        if (index === 0) this._lifeline5050();
        else if (index === 1) this._lifelinePhone();
        else this._lifelineAudience();
    }

    private _lifeline5050() {
        const correct = this._questions[this._questionIndex].correct;
        // Pick 2 wrong answers to eliminate
        const wrongOptions = [0, 1, 2, 3].filter(i => i !== correct);
        // Shuffle & take 2
        wrongOptions.sort(() => Math.random() - 0.5);
        const toRemove = wrongOptions.slice(0, 2);
        toRemove.forEach(i => this.answerButtons[i].markEliminated());
        this.statusText.text = '50:50 – Hai đáp án đã bị loại!';
        // Resume timer after short pause
        setTimeout(() => {
            this.statusText.text = '';
            this._startTimer();
        }, 1500);
    }

    private _lifelinePhone() {
        const correct = this._questions[this._questionIndex].correct;
        const correctLabel = ANSWER_LABELS[correct];
        const hints = Math.random() < 0.8
            ? `"Mình nghĩ câu trả lời là ${correctLabel}: ${this._questions[this._questionIndex].answers[correct]}. Nhưng không chắc lắm nhé!"`
            : `"Mình không chắc... Có thể là ${correctLabel} hoặc ${ANSWER_LABELS[(correct + 2) % 4]}?"`;

        this._showPopup('📞 Gọi cho người thân', `Người thân nói:\n\n${hints}`, () => {
            this._startTimer();
        });
    }

    private _lifelineAudience() {
        const correct = this._questions[this._questionIndex].correct;
        const base = [5, 5, 5, 5];
        base[correct] = 60 + Math.floor(Math.random() * 20);
        const remaining = 100 - base[correct];
        const others = [0, 1, 2, 3].filter(i => i !== correct);
        let leftOver = remaining;
        others.forEach((i, idx) => {
            if (idx === others.length - 1) {
                base[i] = leftOver;
            } else {
                const v = Math.floor(Math.random() * leftOver * 0.6);
                base[i] = v;
                leftOver -= v;
            }
        });

        // Build a custom popup with left-aligned rows
        const popW = Math.min(420, this._screenW - 60);
        const popH = 310;
        const panel = new Container();

        const bg = new Graphics();
        bg.roundRect(0, 0, popW, popH, 18);
        bg.fill({ color: 0x0a0550, alpha: 0.97 });
        bg.stroke({ width: 3, color: C.gold });
        panel.addChild(bg);

        const titleEl = new Text({
            text: '🙋 Hỏi ý kiến khán giả',
            style: { fill: C.gold, fontSize: 22, fontFamily: defaultFont, fontWeight: 'bold', align: 'center' },
        });
        titleEl.anchor.set(0.5, 0);
        titleEl.x = popW / 2; titleEl.y = 16;
        panel.addChild(titleEl);

        const subEl = new Text({
            text: 'Kết quả bình chọn:',
            style: { fill: C.text, fontSize: 16, fontFamily: defaultFont, align: 'center' },
        });
        subEl.anchor.set(0.5, 0);
        subEl.x = popW / 2; subEl.y = 52;
        panel.addChild(subEl);

        // Left-aligned rows
        const rowStartY = 82;
        const rowH = 36;
        const barMaxW = popW - 110; // space for label + bar + percent
        ANSWER_LABELS.forEach((lbl, i) => {
            const pct = base[i];
            const y = rowStartY + i * rowH;

            // Label "A:"
            const lblEl = new Text({
                text: `${lbl}:`,
                style: { fill: C.text, fontSize: 17, fontFamily: defaultFont, fontWeight: 'bold' },
            });
            lblEl.anchor.set(0, 0.5);
            lblEl.x = 20; lblEl.y = y + rowH / 2;
            panel.addChild(lblEl);

            // Bar background
            const barBg = new Graphics();
            barBg.roundRect(50, y + 8, barMaxW, rowH - 16, 4);
            barBg.fill({ color: 0x1a1a4a });
            panel.addChild(barBg);

            // Bar fill
            const barFill = new Graphics();
            const barColor = i === correct ? 0x00cc44 : 0x3b6dff;
            barFill.roundRect(50, y + 8, Math.max(4, barMaxW * pct / 100), rowH - 16, 4);
            barFill.fill({ color: barColor });
            panel.addChild(barFill);

            // Percentage label right of bar
            const pctEl = new Text({
                text: `${pct}%`,
                style: { fill: 0xffffff, fontSize: 15, fontFamily: defaultFont, fontWeight: 'bold' },
            });
            pctEl.anchor.set(0, 0.5);
            pctEl.x = 50 + barMaxW + 8; pctEl.y = y + rowH / 2;
            panel.addChild(pctEl);
        });

        // Close button
        const closeBg = new Graphics();
        closeBg.roundRect(0, 0, 100, 34, 12);
        closeBg.fill({ color: 0x8b0000 });
        closeBg.stroke({ width: 2, color: 0xff4444 });
        const closeLabel = new Text({ text: 'Đóng', style: { fill: C.text, fontSize: 15, fontFamily: defaultFont } });
        closeLabel.anchor.set(0.5); closeLabel.x = 50; closeLabel.y = 17;
        const closeBtn = new Container();
        closeBtn.addChild(closeBg, closeLabel);
        closeBtn.x = (popW - 100) / 2; closeBtn.y = popH - 48;
        closeBtn.eventMode = 'static'; closeBtn.cursor = 'pointer';
        closeBtn.on('pointertap', () => {
            this.overlay.visible = false;
            this.popupContainer.visible = false;
            this.popupContainer.removeChildren();
            this._startTimer();
        });
        panel.addChild(closeBtn);

        panel.x = (this._screenW - popW) / 2;
        panel.y = (this._screenH - popH) / 2;
        this.popupContainer.removeChildren();
        this.popupContainer.addChild(panel);
        this.overlay.visible = true;
        this.popupContainer.visible = true;
    }


    private _showPopup(title: string, body: string, onClose: () => void) {
        const popW = Math.min(420, this._screenW - 60);
        const popH = 260;
        const panel = new OverlayPanel(title, body, popW, popH, () => {
            this.overlay.visible = false;
            this.popupContainer.visible = false;
            this.popupContainer.removeChildren();
            onClose();
        });
        panel.x = (this._screenW - popW) / 2;
        panel.y = (this._screenH - popH) / 2;

        this.popupContainer.removeChildren();
        this.popupContainer.addChild(panel);
        this.overlay.visible = true;
        this.popupContainer.visible = true;
    }

    /* ──────────── Walk away ──────────── */
    private _onWalkAway() {
        if (this._state !== GameState.QUESTION && this._state !== GameState.REVEAL) return;
        this._stopTimer();
        this._state = GameState.WALKAWAY;
        this._showResult('walkaway');
    }

    /* ──────────── Pause ──────────── */
    private _onPause() {
        this._stopTimer();
        game.showScreen(TitleScreen, { window: Windows.pause });
    }

    /* ──────────── End result screen ──────────── */
    private _showResult(outcome: boolean | 'walkaway') {
        this._state = GameState.IDLE;
        this._stopTimer();
        sound.stopBGM();
        if (outcome === true) sound.play('win');
        else if (outcome === 'walkaway') sound.play('walkaway');
        // 'false' (wrong/time up) already played sound in _onTimeUp/_onAnswer
        this.overlay.visible = false;
        this.popupContainer.visible = false;

        const popW = Math.min(460, this._screenW - 40);
        const popH = 280;

        let title: string;
        let body: string;
        let prizeIndex: number;

        if (outcome === true) {
            // Won!
            title = '🏆 CHÚC MỪNG BẠN!';
            body = `Bạn đã trả lời đúng 15 câu hỏi!\nBạn nhận được giải thưởng:\n\n${PRIZES[14]}`;
            prizeIndex = 14;
        } else if (outcome === 'walkaway') {
            prizeIndex = this._questionIndex > 0 ? this._questionIndex - 1 : -1;
            title = '💸 Bạn đã bỏ cuộc';
            body = prizeIndex >= 0
                ? `Bạn mang về:\n\n${PRIZES[prizeIndex]}`
                : 'Bạn ra về tay không!';
        } else {
            // Lost
            prizeIndex = this._getSafePrize();
            title = '😢 Rất tiếc!';
            body = prizeIndex >= 0
                ? `Bạn đã trả lời sai!\nNhờ mốc an toàn, bạn vẫn nhận được:\n\n${PRIZES[prizeIndex]}`
                : 'Bạn đã trả lời sai và ra về tay không!\nChúc may mắn lần sau!';
        }

        const panel = new Container();

        const bg = new Graphics();
        bg.roundRect(0, 0, popW, popH, 20);
        bg.fill({ color: 0x04012b, alpha: 0.98 });
        bg.stroke({ width: 3, color: outcome === true ? C.gold : 0xaa2222 });
        panel.addChild(bg);

        const titleEl = new Text({
            text: title,
            style: { fill: outcome === true ? C.gold : C.text, fontSize: 30, fontFamily: defaultFont, fontWeight: 'bold', align: 'center' },
        });
        titleEl.anchor.set(0.5, 0);
        titleEl.x = popW / 2; titleEl.y = 20;
        panel.addChild(titleEl);

        const bodyEl = new Text({
            text: body,
            style: { fill: C.text, fontSize: 24, fontFamily: defaultFont, align: 'center', wordWrap: true, wordWrapWidth: popW - 40 },
        });
        bodyEl.anchor.set(0.5, 0);
        bodyEl.x = popW / 2; bodyEl.y = 70;
        panel.addChild(bodyEl);

        // Buttons: Play again | Main menu
        const btnW = 140; const btnH = 38;
        const gap = 16;
        const btnY = popH - btnH - 20;

        const makeBtn = (label: string, fillColor: number, border: number, onClick: () => void, bx: number) => {
            const g = new Graphics();
            g.roundRect(0, 0, btnW, btnH, 12);
            g.fill({ color: fillColor });
            g.stroke({ width: 2, color: border });
            const t = new Text({ text: label, style: { fill: C.text, fontSize: 18, fontFamily: defaultFont } });
            t.anchor.set(0.5); t.x = btnW / 2; t.y = btnH / 2;
            const c = new Container();
            c.addChild(g, t);
            c.x = bx; c.y = btnY;
            c.eventMode = 'static'; c.cursor = 'pointer';
            c.on('pointertap', onClick);
            c.on('pointerover', () => gsap.to(c.scale, { x: 1.06, y: 1.06, duration: 0.1 }));
            c.on('pointerout', () => gsap.to(c.scale, { x: 1, y: 1, duration: 0.1 }));
            panel.addChild(c);
        };

        const totalBtnsW = 2 * btnW + gap;
        const btnsStartX = (popW - totalBtnsW) / 2;

        makeBtn('🔄 Chơi lại', 0x0d3b8e, 0x4488ff, async () => {
            const { LoadingScreen } = await import('./LoadingScreen');
            game.showScreen(LoadingScreen);
        }, btnsStartX);

        makeBtn('🏠 Menu chính', 0x1a0033, 0xaa44ff, () => {
            game.showScreen(TitleScreen, { window: Windows.pause });
        }, btnsStartX + btnW + gap);

        panel.x = (this._screenW - popW) / 2;
        panel.y = (this._screenH - popH) / 2;

        this.popupContainer.removeChildren();
        this.popupContainer.addChild(panel);
        this.overlay.visible = true;
        this.popupContainer.visible = true;

        // Animate in
        panel.alpha = 0;
        gsap.to(panel, { alpha: 1, duration: 0.4 });
        gsap.fromTo(panel.scale, { x: 0.85, y: 0.85 }, { x: 1, y: 1, duration: 0.4, ease: 'back.out(1.7)' });
    }

    private _restartGame() {
        this._questionIndex = 0;
        this._lifelineUsed = [false, false, false];
        this._state = GameState.IDLE;
        this.overlay.visible = false;
        this.popupContainer.visible = false;

        // Re-enable lifelines
        this.lifelines.forEach(ll => ll.reset());

        this._loadQuestion();
    }

    /* ──────────── Resize ──────────── */
    public resize(w: number, h: number) {
        super.resize(w, h);
        if (w !== this._screenW || h !== this._screenH) {
            this._screenW = w;
            this._screenH = h;
            this._buildUI(w, h);
            this._loadQuestion();
        }
        this._tryHighlightLadder();
    }
}
