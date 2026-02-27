import { Layout } from '@pixi/layout';
import { AppScreen } from '../components/basic/AppScreen';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { PixiLogo } from '../components/PixiLogo';
import { colors } from '../config/colors';
import { game, SceneData } from '../Game';
import { loadQuestionsForGame } from '../services/questionService';
import { QUESTIONS } from '../config/questions';

/**
 * LoadingScreen – dùng spinner có sẵn, tải câu hỏi Firebase,
 * sau đó chuyển sang GameScreen với câu hỏi đã load sẵn.
 */
export class LoadingScreen extends AppScreen {
    public static assetBundles = ['game'];

    constructor(_data?: SceneData) {
        super('LoadingScreen');

        this.addContent({
            spinnerLayout: new LoadingSpinner(),
            pixiLogo: PixiLogo(),
        });

        this.setStyles({
            background: colors.bg,
        });

        this._fetchAndGo();
    }

    private async _fetchAndGo() {
        let questions;
        try {
            questions = await loadQuestionsForGame();
        } catch {
            questions = [...QUESTIONS];
        }

        // Brief pause so spinner is visible at least a moment
        await new Promise(r => setTimeout(r, 300));

        const { GameScreen } = await import('./GameScreen');
        game.showScreen(GameScreen, { questions });
    }

    public onUpdate() {
        const spinner = this.getChildByID('spinner');
        if (spinner && spinner instanceof Layout) {
            const spinnerSprite = spinner.content.firstChild;
            if (spinnerSprite) spinnerSprite.rotation += 0.05;
        }
    }
}
