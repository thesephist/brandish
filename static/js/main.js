const {
    StyledComponent,
    Record,
    Router,
} = window.Torus;

function encodeGuideKey({
    friendlyAuthority = 0,
    classicModern = 0,
    seriousPlayful = 0,
}) {
    // TODO: improve this to generate prettier slugs
    return `${friendlyAuthority + 2}${classicModern + 2}${seriousPlayful + 2}`
};

function decodeGuideKey(guideKey) {
    const [
        friendlyAuthority,
        classicModern,
        seriousPlayful,
    ] = guideKey.split('').map(ns => +ns - 2);
    return {
        friendlyAuthority,
        classicModern,
        seriousPlayful,
    }
}

/**
 * Rang eslider component fixed at 5 points.
 */
class RangeSlider extends StyledComponent {
    init(record, {
        leftLabel,
        rightLabel,
        name,
    }) {
        this.leftLabel = leftLabel;
        this.rightLabel = rightLabel;
        this.name = name;

        this.onHandleDown = this.onHandleDown.bind(this);
        this.onHandleUp = this.onHandleUp.bind(this);
        this.onHandleMove = this.onHandleMove.bind(this);

        // for dragging
        this.initialV = null;
        this.initialX = null;
        this.incrementX = null;

        this.bind(record, data => this.render(data));
    }
    value() {
        return this.record.data[this.name];
    }
    handleClick(evt) {
        // TODO: handle click anywhere in the bar.
    }
    onHandleDown(evt) {
        evt.preventDefault();
        const handle = evt.target;
        this.initialV = this.value();
        this.initialX = evt.clientX || evt.touches[0].clientX || 0;
        this.incrementX = this.node.querySelector('.slider')
            .getBoundingClientRect().width / 5;
        document.body.addEventListener('mousemove', this.onHandleMove);
        document.body.addEventListener('mouseup', this.onHandleUp);
    }
    onHandleUp(evt) {
        evt.preventDefault();
        const handle = evt.target;
        this.initialV = null;
        this.initialX = null;
        this.incrementX = null;
        document.body.removeEventListener('mousemove', this.onHandleMove);
        document.body.removeEventListener('mouseup', this.onHandleUp);
    }
    onHandleMove(evt) {
        evt.preventDefault();
        const handle = evt.target;
        const nowX = evt.clientX || evt.touches[0].clientX || 0;
        const delta = nowX - this.initialX;
        this.record.update({[this.name]: ~~(delta / this.incrementX) + this.initialV});
    }
    styles() {
        return css`
        margin-bottom: 32px;

        .labels {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            font-size: 1.4em;
            font-weight: bold;
        }

        .sliderContainer {
            position: relative;
        }

        .slider {
            width: 100%;
            height: 14px;
            border-radius: 7px;
            background: var(--fore);
            margin: 16px 0;
        }

        .handle {
            cursor: grab;
            position: absolute;
            top: calc(50% - 8px);
            left: calc(50% - 8px);
            box-sizing: border-box;
            height: 16px;
            width: 16px;
            border-radius: 8px;
            box-shadow: 0 3px 6px -1px rgba(0, 0, 0, .3);
            transition: transform .2s, left .2s;
            transform: scale(1.4);

            &:hover,
            &:active {
                transform: scale(1.8);
            }
            &:active {
                cursor: grabbing;
            }
        }

        .clickPoints {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
        }

        .clickPoint {
            height: 10px;
            width: 10px;
            border-radius: 5px;
            background: var(--fore);
        }
        `;
    }
    compose(data) {
        const pct = (this.value() + 2) * 25;

        return jdom`<div class="rangeSlider">
            <div class="labels">
                <div class="label left">${this.leftLabel}</div>
                <div class="label right">${this.rightLabel}</div>
            </div>
            <div class="sliderContainer">
                <div class="slider"></div>
                <div class="handle"
                    tabindex="1"
                    onmousedown=${this.onHandleDown}
                    style="background:#${data.base};left:calc(${pct}% - 8px)"
                ></div>
            </div>
            <div class="clickPoints">
                <div class="clickPoint"></div>
                <div class="clickPoint"></div>
                <div class="clickPoint"></div>
                <div class="clickPoint"></div>
                <div class="clickPoint"></div>
            </div>
        </div>`;
    }
}

class ColorSwatch extends StyledComponent {
    init(record, {color, editable}) {
        this.color = color;
        this.editable = editable;
        this.handleClick = this.handleClick.bind(this);

        this.bind(record, data => this.render(data));
    }
    styles() {
        return css`
        cursor: pointer;
        height: 64px;
        width: 64px;
        border-radius: 8px;
        margin-right: 12px;
        float: left;
        transition: transform .3s;
        transform: none;
        position: relative;
        text-shadow: 0 2px 3px rgba(0, 0, 0, .3);

        color: var(--fore);
        line-height: 64px;
        text-align: center;

        &.active {
            box-shadow: 0 0 4px 2px var(--fore);
        }

        &:hover {
            transform: translateY(-4px);
        }

        input[type="color"] {
            height: 100%;
            width: 100%;
            display: block;
            opacity: 0;
            cursor: pointer;
            position: absolute;
            top: 0;
            left: 0;
        }
        `;
    }
    handleClick(evt) {
        this.record.update({
            base: this.color,
        });
    }
    compose({base}) {
        let bg = '#' + this.color;
        if (this.editable) {
            bg = `linear-gradient(-45deg, red, yellow, green, blue)`;
        }

        return jdom`<div class="swatch ${this.color === base ? 'active' : ''}" onclick="${this.handleClick}"
            style="background:${bg}">
            ${this.editable ? jdom`<input type="color" oninput="${evt => {
                this.color = evt.target.value;
                this.record.update({
                    base: this.color.substr(1), // assume hex color format
                });
            }}"/>` : null}
            ${this.editable ? 'edit' : null}
        </div>`;
    }
}

class ControlsPane extends StyledComponent {
    init(record, setStateValue) {
        this.sliders = [
            new RangeSlider(record, {
                leftLabel: 'Friendly',
                rightLabel: 'Authoritative',
                name: 'friendlyAuthority',
            }),
            new RangeSlider(record, {
                leftLabel: 'Classic',
                rightLabel: 'Modern',
                name: 'classicModern',
            }),
            new RangeSlider(record, {
                leftLabel: 'Serious',
                rightLabel: 'Playful',
                name: 'seriousPlayful',
            }),
        ];
        this.swatches = [
            '900',
            '090',
            '880',
            '009',
        ].map(c => new ColorSwatch(record, {
            color: c,
            editable: false,
        }));
        this.swatches.push(new ColorSwatch(record, {
            color: 'eee',
            editable: true,
        }));

        this.bind(record, data => this.render(data));
    }
    styles() {
        return css`
        box-sizing: border-box;
        height: 100%;
        width: 100%;
        overflow-y: auto;
        background: var(--back);
        color: var(--fore);
        padding: 12px 36px;
        font-family: 'Source Sans Pro', sans-serif;

        section {
            margin-bottom: 84px;
        }

        .logo-link {
            color: var(--fore);
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
        }

        .controlsBody {
            margin: 24px auto;
            max-width: 500px;
            margin-top: 64px;
        }

        .question {
            font-size: 2.4em;
            margin-bottom: 24px;
        }

        .colorRow {
            display: flex;
            flex-direction: row;
            justify-content: space-between;
        }
        `;
    }
    compose() {
        return jdom`<div class="controlsPaneInner">
            <a class="logo-link" href="/">
                <div class="logo">brandish</div>
            </a>
            <div class="controlsBody">
                <section>
                    <div class="question">
                        How would you describe your brand?
                    </div>
                    ${this.sliders.map(s => s.node)}
                </section>
                <section>
                    <div class="question">
                        Which color best fits your brand?
                    </div>
                    <div class="colorRow">
                        ${this.swatches.map(s => s.node)}
                    </div>
                </section>
            </div>
        </div>`;
    }
}

function chooseTypeface(data) {
    const TYPEFACES = [{
        name: 'Cormorant',
        value: [2, -2, -1.2],
    }, {
        name: 'Libre Baskerville',
        value: [-1.2, 2, -2],
    }, {
        name: 'Arvo',
        value: [1.2, 1.2, 0],
    }, {
        name: 'Roboto',
        value: [.4, .8, 0],
    }, {
        name: 'Open Sans',
        value: [.8, .4, -.4],
    }, {
        name: 'Lato',
        value: [-.4, .4, 0],
    }, {
        name: 'Be Vietnam',
        value: [1.6, -.8, 1.2],
    }, {
        name: 'Montserrat',
        value: [1.2, .4, -.4],
    }, {
        name: 'Hepta Slab',
        value: [-.8, .8, .8],
    }, {
        name: 'Source Sans Pro',
        value: [0, 0, .4],
    }, {
        name: 'Oswald',
        value: [-.8, 1.2, .4],
    }, {
        name: 'Raleway',
        value: [1.2, -.4, .8],
    }, {
        name: 'Merriweather',
        value: [.4, 1.6, -.8],
    }, {
        name: 'Poppins',
        value: [1.2, .8, -.4],
    }, {
        name: 'Big Shoulders Display',
        value: [2, 1.2, -.4],
    }, {
        name: 'Ubuntu',
        value: [1.2, -.4, 0],
    }, {
        name: 'Playfair Display',
        value: [-1.6, 1.2, .4],
    }, {
        name: 'PT Serif',
        value: [-2, 2, -1.2],
    }, {
        name: 'Lora',
        value: [-1.6, 2, -1.2],
    }, {
        name: 'Nunito',
        value: [2, -1.6, 1.6],
    }, {
        name: 'Quicksand',
        value: [2, -.8, 1.2],
    }, {
        name: 'Dosis',
        value: [.8, -2, .4],
    }, {
        name: 'Josefin Sans',
        value: [2, -1.2, 1.2],
    }, {
        name: 'Comfortaa',
        value: [2, -2, 2],
    }, {
        name: 'Abril Fatface',
        value: [-.4, 2, .8],
    }];

    let min = Infinity;
    let closest = TYPEFACES[0].name;
    const dataValue = [
        data.friendlyAuthority,
        data.classicModern,
        data.seriousPlayful
    ];
    for (const {name, value} of TYPEFACES) {
        const distance = Math.pow(dataValue[0] - value[0], 2)
            + Math.pow(dataValue[1] - value[1], 2)
            + Math.pow(dataValue[2] - value[2], 2);
        if (distance < min) {
            closest = name;
            min = distance;
        }
    }

    return closest;
}

function generateComplementaryColorSet(baseColor) {
    if (baseColor.length === 3) {
        baseColor = baseColor[0] + baseColor[0]
            + baseColor[1] + baseColor[1]
            + baseColor[2] + baseColor[2];
    }
    const baseHex = parseInt(baseColor, 16);
    const complement = (0xffffff ^ baseHex).toString(16);
    return {
        primary: baseColor,
        secondary: complement,
        tertiary: baseColor,
    }
}

function generateGuideCSS(data) {
    const typeface = chooseTypeface(data);
    const { primary, secondary, tertiary } = generateComplementaryColorSet(data.base);

    return `
    @import url('https://fonts.googleapis.com/css?family=${typeface.replace(' ', '+')}&display=swap');
    body {
       --color-primary: #${primary};
       --color-secondary: #${secondary};
       --color-tertiary: #${tertiary};
       --font-primary: ${typeface};
       --font-secondary: ${typeface}
    }
    .typeface-primary-name::after {
        content: '${typeface}';
    }
    .typeface-secondary-name::after {
        content: '${typeface}';
    }
    .color-primary-hex::after {
        content: '${data.base}';
    }
    `;
}

class PreviewPane extends StyledComponent {
    init(record) {
        this.lastStyles = '';
        this.firstLoaded = false;

        this.handleLoad = this.handleLoad.bind(this);

        this.bind(record, data => this.render(data));
    }
    updateGuideCSS() {
        if (!this.node) {
            return;
        }

        const stylesheet = generateGuideCSS(this.record.summarize());
        if (stylesheet === this.lastStyles) {
            return;
        }
        const doc = this.node.querySelector('iframe').contentDocument;
        if (!doc) {
            return;
        }

        const linkTag = doc.createElement('style');
        linkTag.setAttribute('data-brandish', '');
        linkTag.innerHTML = stylesheet;

        const prev = doc.head.querySelector('style[data-brandish]');
        if (prev) {
            doc.head.removeChild(prev);
        }
        doc.head.appendChild(linkTag);

        this.lastStyles = stylesheet;
    }
    handleLoad() {
        if (!this.firstLoaded) {
            this.firstLoaded = true;
            this.render();
        }
    }
    styles() {
        return css`
        box-sizing: border-box;
        height: 100%;
        width: 100%;
        overflow: hidden;

        .guide-frame {
            width: 100%;
            height: 100%;
        }
        `;
    }
    compose(data) {
        this.updateGuideCSS();
        return jdom`<div class="previewPaneInner">
            <iframe onload="${this.handleLoad}" class="guide-frame" src="/guide" frameborder="0"></iframe>
        </div>`;
    }
}

class App extends StyledComponent {

    init(router) {
        const state = new Record({
            // default, sensible seeds
            friendlyAuthority: 0,
            classicModern: 0,
            seriousPlayful: 0,
            base: '333',
            secondary: 'abc',
            tertiary: 'eee',
        });

        this.controls = new ControlsPane(state);
        this.preview = new PreviewPane(state);

        this.bind(router, ([name, params]) => {
            switch (name) {
                case 'guide':
                    state.update({
                        ...state.summarize(),
                        ...decodeGuideKey(params.guideKey),
                        base: params.base,
                        secondary: params.secondary,
                        tertiary: params.tertiary,
                    });
                    return;
                default:
                    router.go(`/${encodeGuideKey(state)}/colors/${state.get('base')}/${state.get('secondary')}/${state.get('tertiary')}`);
                    return;
            }
        });
    }

    styles() {
        return css`
        background: #eee;
        height: 100vh;
        width: 100vw;
        display: flex;
        flex-direction: row;

        .half {
            width: 100%;
        }
        .controlsPane {
            max-width: 600px;
            flex-grow: 1;
        }
        .previewPane {
            flex-grow: 1,
        }
        @media only print {
            .controlsPane {
                display: none;
            }
        }
        `;
    }

    compose() {
        // TODO: remove refreshBtn eventually
        return jdom`<div class="app">
            <div class="controlsPane half">
                ${this.controls.node}
            </div>
            <div class="previewPane half">
                ${this.preview.node}
            </div>
        </div>`;
    }

}

const router = new Router({
    guide: '/:guideKey/colors/:base/:secondary/:tertiary',
    default: '/',
});

const app = new App(router);
document.body.appendChild(app.node);

