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
        const r = css`
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
            background: var(--fore);
            box-shadow: 0 3px 6px -1px rgba(0, 0, 0, .3);
            transition: transform .2s;
            border: 2px solid var(--primary);
            transform: scale(1.4);

            &:hover {
                transform: scale(1.5);
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
        console.log(r);
        return r;
    }
    // TODO: probably have a hidden label + input here for a11y
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
                    style="border-color:${data.base};left:calc(${pct}% - 8px)"
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
        background: ${this.color};
        height: 64px;
        width: 64px;
        border-radius: 8px;
        margin-right: 12px;
        float: left;
        `;
    }
    handleClick(evt) {
        this.record.update({
            base: this.color,
        });
    }
    compose() {
        return jdom`<div class="swatch" onclick="${this.handleClick}">
            ${this.editable ? jdom`<input type="color" oninput="${evt => {
                this.color = evt.target.value;
                this.record.update({
                    base: this.color,
                });
            }}"/>` : null}
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
            'red',
            'blue',
            'yellow',
            'green',
        ].map(c => new ColorSwatch(record, {
            color: c,
            editable: false,
        }));
        this.swatches.push(new ColorSwatch(record, {
            color: '#eee',
            editable: true,
        }));

        this.bind(record, data => this.render(data));
    }
    styles() {
        return css`
        box-sizing: border-box;
        height: 100%;
        width: 100%;
        overflow: hidden;
        background: var(--back);
        color: var(--fore);
        padding: 12px 20px;

        .question {
            font-size: 24px;
            font-weight: bold;
        }

        .colorList {
            overflow: hidden;
        }
        `;
    }
    compose() {
        return jdom`<div class="controlsPaneInner">
            <header>
                <div class="logo">brandish</div>
            </header>
            <div class="question">
                How would you describe your brand?
            </div>
            ${this.sliders.map(s => s.node)}
            <div class="question">
                Which color best fits your brand?
            </div>
            <div class="colorList">
                ${this.swatches.map(s => s.node)}
            </div>
        </div>`;
    }
}

function chooseTypeface(data) {
    const TYPEFACES = [{
        name: 'Cormorant',
        value: [2, -2, -2],
    }, {
        name: 'Merriweather',
        value: [-2, 2, -2],
    }, {
        name: 'Playfair Display',
        value: [-2, -2, 2],
    }, {
        name: 'PT Serif',
        value: [2, 2, -2],
    }, {
        name: 'Poppins',
        value: [-2, 2, 2],
    }, {
        name: 'Libre Baskerville',
        value: [2, -2, 2],
    }, {
        name: 'Arvo',
        value: [-2, -2, -2],
    }, {
        name: 'Open Sans',
        value: [1, 2, -2],
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

function generateGuideCSS(data) {
    const typeface = chooseTypeface(data);

    return `
    @import url('https://fonts.googleapis.com/css?family=${typeface.replace(' ', '+')}&display=swap');
    body {
       --color-primary: ${data.base};
       --color-secondary: ${data.base};
       --color-tertiary: ${data.base};
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

        this.bind(record, data => this.render(data));
    }
    updateGuideCSS() {
        if (!this.node) {
            return;
        }

        const stylesheet = generateGuideCSS(this.record.summarize());
        // TODO: diff and quit if same
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
        console.log(prev);
        if (prev) {
            doc.head.removeChild(prev);
        }
        doc.head.appendChild(linkTag);

        this.lastStyles = stylesheet;
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
            <iframe class="guide-frame" src="/guide" frameborder="0"></iframe>
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
                    router.go(`/${encodeGuideKey(state)}/colors/${state.base}/${secondary}/${state.tertiary}`);
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

