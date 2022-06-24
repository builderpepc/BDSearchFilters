# BDSearchFilters
Extra search filters for BetterDiscord. The filters are client side, so you might see pages of blank results if your filters eliminate all the results for the page.

*:warning: This plugin is heavily WIP, and I am not very experienced. Contributions or suggestions are welcome.*

Makes use of ZeresPluginLibrary.

## How it works
When you use Discord's search, an API request is sent with the normal filters you applied, and the results are returned and displayed. Then, the filters from this plugin are applied to the results _shown on the page_. Discord's API servers do not support the filters this plugin applies. This means, unfortunately, that it's impossible to condense all the filtered results into fewer pages.

In theory, it could be done if you fetched all the results at once, but that would be very slow and would definitely get your account locked.

## Features
- [ ] Filter bot/user messages
- [ ] Exclude specific users
- [ ] Exclude specific channels
- [x] String literal searching
- [ ] String literal exclusion
- [x] Regex searching
- [x] Regex exclusion

## Installation
Install like any other BetterDiscord plugin. Download [bdsearchfilters.plugin.js](https://github.com/builderpepc/BDSearchFilters/raw/main/bdsearchfilters.plugin.js) and put it in your BetterDiscord plugins folder.

For now, BDSearchFilters is not available on BetterDiscord's plugin listing.

# Disclaimer
*It is against Discord's Terms of Service to use BetterDiscord and other client modifications. By installing, using, or distributing this software you acknowledge and understand that it is your sole responsibility if something happens to your account and that the contributors of this software are not at fault.*
