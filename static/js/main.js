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
    // TODO: probably have a hidden label + input here for a11y
    compose() {
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
                    style="left:calc(${pct}% - 8px)"
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
        return jdom`<div class="swatch" onclick="${this.handleClick}"></div>`;
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

class PreviewPane extends StyledComponent {
    init(record) {
        this.bind(record, data => this.render(data));
    }
    compose(data) {
        return jdom`<div class="previewPaneInner">
            preview ${JSON.stringify(data)}
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

    compose() {
        // TODO: remove refreshBtn eventually
        return jdom`<div class="app">
            <a href="/" class="refreshBtn">refresh (dev)</a>
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

