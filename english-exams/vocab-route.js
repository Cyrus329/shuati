'use strict';
const journalPage = new URL('../index.html', location.href).href.toLowerCase();
const journalRoute = window.WORDLINK_LOCATIONS.find(route => route.page.toLowerCase() === journalPage);
if (journalRoute) window.WORDLINK_LOCATIONS.push({page: location.href, target: journalRoute.target});
