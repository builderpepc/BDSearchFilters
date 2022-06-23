/**
 * @name BDSearchFilters
 * @author builderpepc
 * @description Client-side search filters and tools.
 * @version 0.1.0a
 * @authorLink https://github.com/builderpepc/
 * @website https://github.com/builderpepc/BDSearchFilters/
 * @source https://github.com/builderpepc/BDSearchFilters/
 * @updateUrl https://raw.githubusercontent.com/builderpepc/BDSearchFilters/main/bdsearchfilters.plugin.js
 */

const MODAL_TEXT_CLASS = "defaultColor-24IHKz text-md-normal-304U3g spacing-2kYqCu";
const TOTAL_RESULT_COUNT_CLASS = "totalResults-2On644";
const RESULT_CONTAINER_CLASS = "container-rZM65Y";
const RESULT_MSG_CONTENT_CLASS = "messageContent-2t3eCI";

const Dispatcher = BdApi.findModuleByProps("dirtyDispatch");

module.exports = class BDSearchFilters {

    constructor() {
        window.ExtraSearchFilters = this;
        
        window.ExtraSearchFilters.searchFilters = {
            literalTerms: []
        }
    }

    stop() { 
        this.removeSearchFiltersButton();
    };

    start() {
        if (!global.ZeresPluginLibrary) {
            // figure out the proper way to do this later
            linkJS("https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
        }

        // referenced MessageLogger's code to try and figure out how to do this

        const iconInfo = ZeresPluginLibrary.WebpackModules.getByProps('container', 'children', 'toolbar', 'iconWrapper');
        this.buttonLabel = "Extra Search Filters";

        this.filtersMenuButton = document.createElement('div');
        this.filtersMenuButton.classList.add(iconInfo.iconWrapper);
        this.filtersMenuButton.classList.add(iconInfo.clickable);
        this.filtersMenuButton.setAttribute("role", "button");

        this.filtersMenuButtonInner = document.createElement('div');
        this.filtersMenuButtonInner.classList.add(iconInfo.icon);
        this.filtersMenuButtonInner.setAttribute('name', this.buttonLabel);
        this.filtersMenuButtonInner.setAttribute('aria-hidden', 'true');
        this.filtersMenuButton.appendChild(this.filtersMenuButtonInner);

        // SVG from Google Fonts
        // https://fonts.google.com/icons?selected=Material%20Symbols%20Outlined%3Atune%3AFILL%400%3Bwght%40400%3BGRAD%400%3Bopsz%4024
        let link = document.createElement('link');
        link.rel = "stylesheet"
        link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
        document.getElementsByTagName('head')[0].appendChild(link);

        this.filtersMenuButtonInner.innerHTML = '<span class="material-symbols-outlined">tune</span>';

        this.filtersMenuButton.addEventListener('click', () => {
            this.showMenu();
        });

        new ZeresPluginLibrary.Tooltip(this.filtersMenuButton, this.buttonLabel, { side: 'bottom' });

        this.addSearchFiltersButton();
        
        window.ExtraSearchFilters.isSearchPanelOpen = this.isSearchPanelOpen;
        Dispatcher.subscribe("SEARCH_FINISH", this.evaluateFilters);
        
    };

    addSearchFiltersButton() {
        // credit to 1Lighty's MessageLoggerV2
        const parent = document.querySelector('div[class*="chat-"] div[class*="toolbar-"]');
        if (!parent) return;
        const srch = parent.querySelector('div[class*="search-"]');
        if (!srch) return;
        parent.insertBefore(this.filtersMenuButton, srch);
    };

    removeSearchFiltersButton() {
        this.filtersMenuButton.remove();
    }

    onSwitch() {
        // for some reason the button disappears on channel switch. there is a noticeable delay for it to reappear. needs to be worked on

        // selected channel not null, and button is removed
        if (ZeresPluginLibrary.DiscordModules.SelectedChannelStore.getChannelId() && !this.filtersMenuButton.isConnected) {
            this.addSearchFiltersButton();
        }
    };

    updateFilters() {
        // split literals by newline and eliminate empty terms or spaces
        window.ExtraSearchFilters.searchFilters.literalTerms = document.getElementById('extrasearchfilters-search-literal-text').value.split("\n").filter((x)=> (x && x != ' '));
        window.ExtraSearchFilters.evaluateFilters();
    };

    isSearchPanelOpen() {
        // selects total results count
        return document.getElementsByClassName(TOTAL_RESULT_COUNT_CLASS).length > 0;
    }

    getSearchResults() {
        return document.getElementsByClassName(RESULT_CONTAINER_CLASS);
    }

    isPassingFilters(result) {
        // result is an item returned by getSearchResults()
        // return ((window.ExtraSearchFilters.searchFilters.literalTerms.filter((x) => (result.firstChild.firstChild.firstChild.firstChild.getElementsByClassName(RESULT_MSG_CONTENT_CLASS).length > 0 && result.firstChild.firstChild.firstChild.firstChild.children[2].innerText.includes(x)))).length == window.ExtraSearchFilters.searchFilters.literalTerms.length);
        return ((window.ExtraSearchFilters.searchFilters.literalTerms.filter((x) => (result.getElementsByClassName(RESULT_MSG_CONTENT_CLASS).length > 0 && result.getElementsByClassName(RESULT_MSG_CONTENT_CLASS)[0].innerText.includes(x)))).length > 0);
    }

    evaluateFilters() {
        if (!window.ExtraSearchFilters.isSearchPanelOpen()) return;
        for (const rslt of window.ExtraSearchFilters.getSearchResults()) {
            if (!window.ExtraSearchFilters.isPassingFilters(rslt)) {
                rslt.style.opacity = 0.3;
            }
            else {
                rslt.style.opacity = 1;
            }
        }
    }

    showMenu() {
        ZeresPluginLibrary.Modals.showModal(
            this.buttonLabel,
            [
                BdApi.React.createElement('div', {class: MODAL_TEXT_CLASS}, "Keep in mind that these filters are applied on our end, not Discord's. You might have to click through pages of empty results if none of them pass these filters."),
                
                BdApi.React.createElement('div', {class: MODAL_TEXT_CLASS}, "If you enter terms below, results will only be included if they contain one or more of those terms. Separate with newlines."),
                BdApi.React.createElement(
                    'textarea', 
                    {
                        id: "extrasearchfilters-search-literal-text",
                        rows: 5,
                        readonly: false,
                        style: {
                            'background': "var(--input-background)",
                            'color': "var(--text-normal)",
                            'font-family': "var(--font-primary)",
                            'resize': 'none',
                            'width': '100%',
                            'padding': '0 0 0 0'
                        }
                    },
                    this.searchFilters.literalTerms.join('\n')
                )
            ],
            {
                confirmText: "Apply",
                onConfirm: this.updateFilters
            }
        );
    };

}

// Some example code used from https://gist.github.com/mininmobile/aff422d0784e78a13e167b8627633629