/**
 * @name BDSearchFilters
 * @author builderpepc
 * @description Client-side search filters and tools.
 * @version 0.2.1a
 * @authorLink https://github.com/builderpepc/
 * @website https://github.com/builderpepc/BDSearchFilters/
 * @source https://github.com/builderpepc/BDSearchFilters/
 * @updateUrl https://raw.githubusercontent.com/builderpepc/BDSearchFilters/main/bdsearchfilters.plugin.js
 */

const MODAL_TEXT_CLASS = "defaultColor-24IHKz text-md-normal-304U3g spacing-2kYqCu";
const TOTAL_RESULT_COUNT_CLASS = "text-md-normal-304U3g";
const RESULT_CONTAINER_CLASS = "container-rZM65Y";
const RESULT_MSG_CONTENT_CLASS = "messageContent-2t3eCI";
const SMALL_TITLE = "colorStandard-1Xxp1s size14-k_3Hy4 h5-2RwDNl title-3hptVQ marginBottom8-emkd0_";
const SEARCH_HEADER_CLASS = "searchHeader-1r_ZSh"

const Dispatcher = BdApi.findModuleByProps("dirtyDispatch");
const { useState } = BdApi.React;

module.exports = class BDSearchFilters {

    constructor() {
        window.ExtraSearchFilters = this;
        
        window.ExtraSearchFilters.searchFilters = {
            literalTerms: [],
            literalsCaseSensitive: false,
            requireAllLiterals: false,
            searchRegex: null,
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
        window.ExtraSearchFilters.searchFilters.literalTerms = document.getElementById('bdsearchfilters-search-literal-text').value.split("\n").filter((x)=> (x && x != ' '));
        let regexValue = document.getElementById('bdsearchfilters-search-regex').value;
        window.ExtraSearchFilters.searchFilters.searchRegex = regexValue != "" ? new RegExp(regexValue) : null;
        for (const k of Object.keys(window.ExtraSearchFilters.newFilters)) {
            window.ExtraSearchFilters.searchFilters[k] = window.ExtraSearchFilters.newFilters[k];
        }
        window.ExtraSearchFilters.evaluateFilters();
        window.ExtraSearchFilters.updateResultCount();
    };

    isSearchPanelOpen() {
        // selects total results count
        return document.getElementsByClassName(SEARCH_HEADER_CLASS).length > 0;
    }

    getResultCountElt() {
        if (!this.isSearchPanelOpen()) return;
        return document.getElementsByClassName(TOTAL_RESULT_COUNT_CLASS)[0];
    }

    getSearchResults() {
        return document.getElementsByClassName(RESULT_CONTAINER_CLASS);
    }

    isPassingFilters(result) {
        // result is an item returned by getSearchResults()
        // return ((window.ExtraSearchFilters.searchFilters.literalTerms.filter((x) => (result.firstChild.firstChild.firstChild.firstChild.getElementsByClassName(RESULT_MSG_CONTENT_CLASS).length > 0 && result.firstChild.firstChild.firstChild.firstChild.children[2].innerText.includes(x)))).length == window.ExtraSearchFilters.searchFilters.literalTerms.length);
        const searchFilters = window.ExtraSearchFilters.searchFilters;
        return (!(searchFilters.searchRegex instanceof RegExp) ? true : (result.innerText.search(searchFilters.searchRegex) != -1)) && (searchFilters.literalTerms.length > 0 ? ((searchFilters.literalTerms.filter((x) => (result.getElementsByClassName(RESULT_MSG_CONTENT_CLASS).length > 0 && (searchFilters.literalsCaseSensitive ? result.getElementsByClassName(RESULT_MSG_CONTENT_CLASS)[0].innerText.includes(x) : result.getElementsByClassName(RESULT_MSG_CONTENT_CLASS)[0].innerText.toLowerCase().includes(x.toLowerCase()))))).length >= (searchFilters.requireAllLiterals ? searchFilters.literalTerms.length : 1)) : true);
    }

    evaluateFilters() {
        if (!window.ExtraSearchFilters.isSearchPanelOpen()) return;
        let passCount = 0;
        let totalCount = 0; // for page
        for (const rslt of window.ExtraSearchFilters.getSearchResults()) {
            if (!window.ExtraSearchFilters.isPassingFilters(rslt)) {
                rslt.style.opacity = 0.3;
            }
            else {
                rslt.style.opacity = 1;
                passCount++;
            }
            totalCount++;
        }
        window.ExtraSearchFilters.updateResultCount();
    }

    updateResultCount() {
        if (!window.ExtraSearchFilters.isSearchPanelOpen()) return;
        let resultCountElt = window.ExtraSearchFilters.getResultCountElt();
        let results = Array.from(window.ExtraSearchFilters.getSearchResults());
        if (!document.getElementById('bdsearchfilters-filtered-page-result-count') ) {
            let fullCount = resultCountElt.innerText.split(" ")[0].replace(",", "");
            
            if (isNaN(fullCount)) {
                fullCount = 0;
            }
            else {
                fullCount = parseInt(fullCount);
            }
            if (fullCount > 0) {
                resultCountElt.innerHTML = `${fullCount} total results<br><span id="bdsearchfilters-filtered-page-result-count">Loading</span>/<span id="bdsearchfilters-total-page-result-count">Loading...</span> shown on page`;
                resultCountElt.style['font-size'] = "12px";
                resultCountElt.style.color = "var(--text-normal)";
            }
            
        }
        document.getElementById('bdsearchfilters-filtered-page-result-count').innerText = results.filter((x)=>(x.style.opacity == 1)).length.toString();
        document.getElementById('bdsearchfilters-total-page-result-count').innerText = results.length.toString();
        
    }

    observer(changes) {
        if (changes.target == this.getResultCountElt() && !changes.target.innerText.includes("total") && !changes.target.innerText.includes("...")) {
            this.updateResultCount();
        }
    }

    showMenu() {
        window.ExtraSearchFilters.newFilters = {};
        ZeresPluginLibrary.Modals.showModal(
            this.buttonLabel,
            [
                BdApi.React.createElement('div', {class: MODAL_TEXT_CLASS}, "Keep in mind that these filters are applied on our end, not Discord's. You might have to click through pages of empty results if none of them pass these filters."),
                
                BdApi.React.createElement('h5', {class: SMALL_TITLE}, "Literal Text Filters"),
                BdApi.React.createElement('div', {class: MODAL_TEXT_CLASS}, "If you enter terms below, results will only be included if they contain one or more of those terms (must match EXACTLY). Separate with newlines."),
                BdApi.React.createElement(
                    'textarea', 
                    {
                        id: "bdsearchfilters-search-literal-text",
                        rows: 5,
                        readonly: false,
                        style: {
                            'background': "var(--input-background)",
                            'color': "var(--text-normal)",
                            'font-family': "var(--font-primary)",
                            'resize': 'none',
                            'width': 'calc(100% - 12px)',
                            'padding': '5px'
                        }
                    },
                    this.searchFilters.literalTerms.join('\n')
                ),
                BdApi.React.createElement('br'),
                BdApi.React.createElement('br'),
                BdApi.React.createElement(function (props) {
                    const [literalsCaseSensitive, setLiteralsCaseSensitive] = useState(window.ExtraSearchFilters.searchFilters.literalsCaseSensitive);
                    return BdApi.React.createElement(ZeresPluginLibrary.DiscordModules.SwitchRow, {
                        value: literalsCaseSensitive,
                        children: "Case Sensitivity",
                        note: "Whether the filter above should be case-sensitive.",
                        onChange: (e, s, t) => {
                            setLiteralsCaseSensitive(e);
                            window.ExtraSearchFilters.newFilters.literalsCaseSensitive = e;
                        }
                    })
                }),
                BdApi.React.createElement(function (props) {
                    const [requireAllLiterals, setRequireAllLiterals] = useState(window.ExtraSearchFilters.searchFilters.requireAllLiterals);
                    return BdApi.React.createElement(ZeresPluginLibrary.DiscordModules.SwitchRow, {
                        value: requireAllLiterals,
                        children: "Require All Literals",
                        note: "Whether all terms from the above filter should be required or if results with any one of the terms will be shown instead.",
                        onChange: (e, s, t) => {
                            setRequireAllLiterals(e);
                            window.ExtraSearchFilters.newFilters.requireAllLiterals = e;
                        }
                    })
                }),

                BdApi.React.createElement('h5', {class: SMALL_TITLE}, "Regular Expressions"),
                BdApi.React.createElement('div', {class: MODAL_TEXT_CLASS}, "Enter a regular expression to look for in your query."),
                BdApi.React.createElement(
                    'textarea', 
                    {
                        id: "bdsearchfilters-search-regex",
                        rows: 3,
                        readonly: false,
                        style: {
                            'background': "var(--input-background)",
                            'color': "var(--text-normal)",
                            'font-family': "var(--font-primary)",
                            'resize': 'none',
                            'width': 'calc(100% - 12px)',
                            'padding': '5px'
                        }
                    },
                    this.searchFilters.searchRegex == null ? "" : this.searchFilters.searchRegex.toString().slice(1, -1)
                ),
                
            ],
            {
                confirmText: "Apply",
                onConfirm: this.updateFilters
            }
        );
    };

}
