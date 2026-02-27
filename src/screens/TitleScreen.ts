import { AppScreen } from '../components/basic/AppScreen';
import { Window } from '../components/basic/Window';
import { InfoWindow } from '../components/windows/InfoWindow';
import { LevelsWindow } from '../components/windows/LevelsWindow';
import { LoginWindow } from '../components/windows/LoginWindow';
import { PauseWindow } from '../components/windows/PauseWindow';
import { SettingsWindow } from '../components/windows/SettingsWindow';
import { colors } from '../config/colors';
import { defaultFont } from '../config/texts';
import { Windows } from '../config/windows';
import { ViewController } from '../controllers/ViewController';
import { game, SceneData } from '../Game';
import { getUrlParam } from '../utils/gtUrlParams';

/** Title screen.
 * To be used to show when game is on pause or before the game starts.
 */
export class TitleScreen extends AppScreen {
    // extends AppScreen that extends Layout that extends PIXI.Container
    public static assetBundles = ['game']; // set section of assets to preload for this screen. Section is defined in assets.json. Handled by AssetLoader.

    private views: ViewController; // view controller, used to manage windows

    static defaultWindow = Windows.levels; // default window to show

    constructor(options?: SceneData) {
        super('TitleScreen'); // Creates Layout with id 'TitleScreen'

        // add game background, handled by Game class to be shown on all screens
        // we add it here as we have to wait for it to be preloaded
        game.addBG();
        this.addLevel(); // add level text to the screen
        this.views = new ViewController(); // create view controller

        this.createWindows(options?.window); // create windows
    }

    /** Create windows.
     * Windows are Layout based components that are shown on top of the screen.
     */
    private createWindows(
        activeWindow?: Windows, // active window to show
    ) {
        this.addWindow(Windows.login, new LoginWindow(this.views)); // create LevelsWindow
        this.addWindow(Windows.levels, new LevelsWindow(this.views)); // create LevelsWindow
        this.addWindow(Windows.pause, new PauseWindow(this.views)); // create PauseWindow
        this.addWindow(Windows.settings, new SettingsWindow(this.views)); // create SettingsWindow
        this.addWindow(Windows.info, new InfoWindow(this.views)); // create InfoWindow

        this.showActiveWindow(activeWindow); // show active window
    }
    private addLevel() {
        this.addContent({
            // add content to the screen layout
            content: `AI LÀ PHÚ`, // layout content is a string (this will be converted to pixi Text)
            styles: {
                // styles is an object with all the styles that will be applied to the layer
                position: 'centerTop', // center Layout in the top middle of parent (AppScreen layout in this case)
                color: colors.text, // set text color (this will be propagated to a pixi Text element created under the hoof)
                fontSize: 100, // set font size (this will be propagated to a pixi Text element created under the hoof)
                marginTop: 20, // move 10px down from the top of the parent as the anchor point is 0.5
                fontFamily: defaultFont, // set font family (this will be propagated to a pixi Text element created under the hoof)
                maxWidth: '30%', // set max width to 30% of the parent width so the layout witt scale down if the screen width is too small to fit it
                maxHeight: '10%', // set max height to 10% of the parent height so the layout witt scale down if the screen height is too small to fit it
                stroke: { width: 8, color: colors.disabledStroke }, // text stroke color and thickness
            },
        });
    }
    /** Add window to the view controller and screen. */
    private addWindow(
        window: Windows, // window id
        content: Window, // window content component
    ) {
        this.views.add(window, content); // add window to the view controller

        this.addContent({
            // add window to layout system
            [window]: this.views.get(window), // get window from the view controller and add it to layout system
        });
    }

    /** Show active window. */
    private async showActiveWindow(
        activeWindow?: Windows, // window id to show
    ) {
        const window = getUrlParam('window'); // get window param from url, used for debugging (TODO: remove this on production)

        // If window param is set, try to show it. If it fails, show default window.
        if (window) {
            try {
                await this.views.show(Windows[window as keyof typeof Windows]); // try to show window
                return;
            } catch (e) {
                // if window is not found, show message in console
                const error: Error = e as Error; // cast error to Error type
                console.error(error.message.replace('"undefined"', window)); // show error message
            }
        }

        await this.views.show(activeWindow ?? TitleScreen.defaultWindow); // show active window or default window
    }
}
