const {
    Component,
    StyledComponent,
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
    ] = guideKey.split('').map(ns => +ns);
    return {
        friendlyAuthority,
        classicModern,
        seriousPlayful,
    }
}

function ControlsPane(state) {
    return jdom`controls`;
}

function PreviewPane(state) {
    return jdom`preview`;
}

class App extends StyledComponent {

    init(router) {
        this.state = {
            // default, sensible seeds
            friendlyAuthority: 0,
            classicModern: 0,
            seriousPlayful: 0,
            base: '333',
            secondary: 'abc',
            tertiary: 'eee',
        }

        this.bind(router, ([name, params]) => {
            switch (name) {
                case 'guide':
                    this.state = {
                        ...this.state,
                        ...decodeGuideKey(params.guideKey),
                        base: params.base,
                        secondary: params.secondary,
                        tertiary: params.tertiary,
                    }
                    this.render();
                    return;
                default:
                    router.go(`/${encodeGuideKey(this.state)}/colors/${this.state.base}/${this.state.secondary}/${this.state.tertiary}`);
                    return;
            }
        });
    }

    compose() {
        return jdom`<div id="brandish">
            <a href="/">refresh (dev)</a>
            <h1>Brandish</h1>
            <div class="controlsPane">
                ${ControlsPane(this.state)}
            </div>
            <div class="previewPane">
                ${PreviewPane(this.state)}
            </div>
        </div>`;
    }

}

const router = new Router({
    guide: '/:guideKey/colors/:base/:secondary/:tertiary',
    default: '/',
});

const app = new App(router);
document.getElementById('app').appendChild(app.node);

