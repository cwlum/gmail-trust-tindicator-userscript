// ==UserScript==
// @name           Gmail Trust Indicator
// @namespace      http://tampermonkey.net/
// @version        1.0
// @description    Gmail Trust Indicator enhances your Gmail experience by displaying sender domains and icons for quick identification and helps you manage your trusted senders.
// @author         Cervantes Wu
// @match          https://mail.google.com/*
// @icon           https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico
// @license        MIT
// @grant          GM_setValue
// @grant          GM_getValue
// @grant          GM_registerMenuCommand
// @grant          GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Check if running in the top window.
    if (window.self !== window.top) return;

    // Get the user ID.
    const userIdMatch = window.location.href.match(/\/u\/(\d+)\//);
    if (!userIdMatch) {
        console.error('Gmail Trust Indicator: Unable to retrieve user ID.');
        return;
    }
    const userId = userIdMatch[1];

    // Configuration (loaded once). Use defaults if not set.
    const addIcon = GM_getValue('addIcon', true);
    const addDomain = GM_getValue('addDomain', true);
    const highlightUntrusted = GM_getValue('highlightUntrusted', false);
    const allowedDomainsKey = `allowedDomains_${userId}`;
    const allowedEmailsKey = `allowedEmails_${userId}`;
    let allowedDomains = GM_getValue(allowedDomainsKey, []);
    let allowedEmails = GM_getValue(allowedEmailsKey, []);

    // Short-circuit if all features are disabled.
    if (!addIcon && !addDomain && allowedDomains.length === 0 && allowedEmails.length === 0 && !highlightUntrusted) return;

    const processedElements = new WeakSet(); // Use WeakSet to avoid memory leaks.

    // BroadcastChannel for cross-tab communication.
    const channel = new BroadcastChannel('GmailTrustIndicatorChannel');
    channel.onmessage = (event) => {
        if (event.data.type === 'updateLists') {
            loadAllowedLists();
            updateAllDomainStates();
        }
    };

    // Load the allowed domain and email lists.
    function loadAllowedLists() {
        allowedDomains = GM_getValue(allowedDomainsKey, []);
        allowedEmails = GM_getValue(allowedEmailsKey, []);
    }

    // --- DOM Manipulation Functions ---

    // Creates the domain container element.
    function createDomainContainer(email) {
        const domain = extractDomain(email);
        const container = document.createElement('div');
        container.className = 'domain-container';
        container.onclick = (event) => domainContainerEvent(event, container, email);
        container.addEventListener('mouseover', () => showDetailedTooltip(container, email));
        container.addEventListener('mouseout', hideDetailedTooltip);

        if (addIcon) {
            const icon = document.createElement('img');
            icon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
            icon.className = 'domain-icon';
            container.appendChild(icon);
        }
        if (addDomain) {
            const domainSpan = document.createElement('span');
            domainSpan.className = 'domain-text';
            domainSpan.textContent = domain;
            container.appendChild(domainSpan);
        }
        updateDomainState(container, email);
        return container;
    }

    // Updates the domain container's state (allowed or not).
    function updateDomainState(container, email) {
        const domain = extractDomain(email);
        const isAllowed = allowedDomains.includes(domain) || allowedEmails.includes(email);
        container.classList.toggle('allowed-domain', isAllowed);
        container.classList.toggle('not-allowed-domain', !isAllowed);
    }

    // --- Whitelist Management Functions ---

    // Toggles the email in the whitelist.
    function toggleEmailInWhitelist(email) {
        const index = allowedEmails.indexOf(email);
        if (index > -1) {
            allowedEmails.splice(index, 1);
            GM_setValue(allowedEmailsKey, allowedEmails);
            return `Removed email from whitelist: ${email}`;
        } else {
            allowedEmails.push(email);
            GM_setValue(allowedEmailsKey, allowedEmails);
            return `Added email to whitelist: ${email}`;
        }
    }

    // Toggles the domain in the whitelist.
    function toggleDomainInWhitelist(domain) {
        const index = allowedDomains.indexOf(domain);
        if (index > -1) {
            allowedDomains.splice(index, 1);
            GM_setValue(allowedDomainsKey, allowedDomains);
            return `Removed domain from whitelist: ${domain}`;
        } else {
            return null;
        }
    }

    // Handles clicks on the domain container.
    function domainContainerEvent(event, container, email) {
        event.preventDefault();
        event.stopPropagation();

        const domain = extractDomain(email);
        let message = '';

        if (allowedEmails.includes(email)) {
            message = toggleEmailInWhitelist(email);
        } else if (allowedDomains.includes(domain)) {
            message = toggleDomainInWhitelist(domain);
        } else {
            message = toggleEmailInWhitelist(email);
        }

        if (message) {
            loadAllowedLists(); // Refresh lists.
            updateAllDomainStates();
            showTooltip(container, message);
            channel.postMessage({ type: 'updateLists' });
        }
    }

    // Updates the state of all domain containers.
    function updateAllDomainStates() {
        const nameElements = document.querySelectorAll('.bA4, .bAK, .bAp');

        requestAnimationFrame(() => {
            nameElements.forEach((element) => {
                const emailElement = element.querySelector('[email]');
                if (!emailElement) return;

                const email = emailElement.getAttribute('email');
                let domainContainer = element.querySelector('.domain-container');

                if (domainContainer) {
                    updateDomainState(domainContainer, email);
                }

                if (highlightUntrusted) {
                    const domain = extractDomain(email);
                    const isAllowed = allowedDomains.includes(domain) || allowedEmails.includes(email);
                    const emailRow = element.closest('.zA');
                    if (emailRow) {
                        emailRow.classList.toggle('untrusted-email', !isAllowed);
                    }
                } else {
                    const emailRow = element.closest('.zA');
                    if (emailRow) {
                        emailRow.classList.remove('untrusted-email');
                    }
                }
            });
        });
    }

    // --- Tooltip Functions ---

    // Shows a tooltip.
    function showTooltip(element, message) {
        let tooltip = element.querySelector('.custom-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('span');
            tooltip.className = 'custom-tooltip';
            element.appendChild(tooltip);
        }
        tooltip.textContent = message;

        clearTimeout(element.tooltipTimeout);
        element.tooltipTimeout = setTimeout(() => {
            if (element.contains(tooltip)) {
                element.removeChild(tooltip);
            }
            element.tooltipTimeout = null;
        }, 3000);
    }

    let detailedTooltip = null;

    // Shows a detailed tooltip.
    function showDetailedTooltip(element, email) {
        if (!detailedTooltip) {
            detailedTooltip = document.createElement('div');
            detailedTooltip.className = 'detailed-tooltip';
            document.body.appendChild(detailedTooltip);
        }

        const domain = extractDomain(email);
        const isAllowed = allowedDomains.includes(domain) || allowedEmails.includes(email);
        detailedTooltip.innerHTML = `Email Address: ${email}<br>Domain: ${domain}<br>Whitelisted: ${isAllowed ? 'Yes' : 'No'}`;
        detailedTooltip.style.display = 'block';

        const rect = element.getBoundingClientRect();
        detailedTooltip.style.left = `${rect.right + 10}px`;
        detailedTooltip.style.top = `${rect.top + window.scrollY - 5}px`;

        const tooltipRect = detailedTooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            detailedTooltip.style.left = `${rect.left - tooltipRect.width - 10}px`;
        }
        if (tooltipRect.bottom > window.innerHeight) {
            detailedTooltip.style.top = `${rect.bottom + window.scrollY - tooltipRect.height + 5}px`;
        }
    }

    // Hides the detailed tooltip.
    function hideDetailedTooltip() {
        if (detailedTooltip) {
            detailedTooltip.style.display = 'none';
        }
    }

    // --- Utility Functions ---

    // Extracts the domain from an email address.
    function extractDomain(email) {
        const domainParts = email.split('@')[1].split('.');
        const len = domainParts.length;
        if (len >= 3 && (domainParts[len - 2] === 'com' || domainParts[len - 2] === 'co')) {
            return domainParts.slice(len - 3).join('.');
        }
        return domainParts.slice(len - 2).join('.');
    }

    // --- Menu Commands ---

    // Adds Tampermonkey menu commands.
    function addMenuCommands() {
        GM_registerMenuCommand('⚙️ Manage Whitelist', openWhitelistPanel);

        GM_registerMenuCommand(`✅ / ❌ Show/Hide Icons`, () => {
            GM_setValue('addIcon', !addIcon);
            window.location.reload();
        });

        GM_registerMenuCommand(`✅ / ❌ Show/Hide Domains`, () => {
            GM_setValue('addDomain', !addDomain);
            window.location.reload();
        });

        GM_registerMenuCommand('✅ / ❌ Highlight Untrusted Emails', () => {
            GM_setValue('highlightUntrusted', !highlightUntrusted);
            window.location.reload();
        });

        GM_registerMenuCommand('🗑️ Clear All Whitelists', () => {
            if (confirm("Are you sure you want to clear all whitelists for all accounts?")) {
                GM_setValue(allowedDomainsKey, []);
                GM_setValue(allowedEmailsKey, []);
                loadAllowedLists();
                updateAllDomainStates();
                channel.postMessage({ type: 'updateLists' });
            }
        });
    }

    // --- Whitelist Panel ---

    // Opens the whitelist management panel.
    function openWhitelistPanel() {
        let panel = document.getElementById('whitelist-panel');
        if (panel) {
            panel.style.display = 'block';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'whitelist-panel';
        panel.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: white; border: 1px solid #ccc; padding: 20px; z-index: 10000; width: 500px; max-height: 600px; overflow-y: auto; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); font-family: sans-serif; border-radius: 8px;`;

        panel.innerHTML = `<h2>Whitelist Management</h2>
                           <div style="margin-bottom: 10px;"><input type="text" id="whitelist-search" placeholder="Search..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"></div>
                           <ul id="whitelist-items" style="list-style: none; padding: 0;"></ul>
                           <div style="margin-top: 10px; display: flex; justify-content: space-between;">
                               <button class="panel-button" id="add-domain">Add Domain</button>
                               <button class="panel-button" id="add-email">Add Email</button>
                               <button class="panel-button" id="whitelist-close" style="background-color: #f44336;">Close</button>
                           </div>`;

        document.body.appendChild(panel);

        document.getElementById('whitelist-close').addEventListener('click', () => {
            panel.style.display = 'none';
        });

        document.getElementById('add-domain').addEventListener('click', () => {
            const domain = prompt("Enter the domain to add:");
            if (domain && domain.trim() !== "" && domain.includes(".")) {
                allowedDomains.push(domain.trim());
                GM_setValue(allowedDomainsKey, allowedDomains);
                loadAllowedLists();
                populateWhitelistItems();
                updateAllDomainStates();
                channel.postMessage({ type: 'updateLists' });
            } else if (domain) {
                alert("Invalid domain format. Please enter a valid domain (e.g., example.com).");
            }
        });

        document.getElementById('add-email').addEventListener('click', () => {
            const email = prompt("Enter the email address to add:");
            if (email && email.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                allowedEmails.push(email.trim());
                GM_setValue(allowedEmailsKey, allowedEmails);
                loadAllowedLists();
                populateWhitelistItems();
                updateAllDomainStates();
                channel.postMessage({ type: 'updateLists' });
            } else if (email) {
                alert("Invalid email format. Please enter a valid email address.");
            }
        });

        document.getElementById('whitelist-search').addEventListener('input', () => {
            const searchTerm = document.getElementById('whitelist-search').value.toLowerCase();
            document.querySelectorAll('#whitelist-items li').forEach(item => {
                item.style.display = item.textContent.toLowerCase().includes(searchTerm) ? '' : 'none';
            });
        });

        populateWhitelistItems();
    }

    // Populates the whitelist items in the panel.
    function populateWhitelistItems() {
        const whitelistItems = document.getElementById('whitelist-items');
        whitelistItems.innerHTML = '';

        allowedDomains.forEach(domain => {
            const listItem = createWhitelistItem(domain, () => {
                allowedDomains.splice(allowedDomains.indexOf(domain), 1);
                GM_setValue(allowedDomainsKey, allowedDomains);
                loadAllowedLists();
                populateWhitelistItems();
                updateAllDomainStates();
                channel.postMessage({ type: 'updateLists' });
            });
            whitelistItems.appendChild(listItem);
        });

        allowedEmails.forEach(email => {
            const listItem = createWhitelistItem(email, () => {
                allowedEmails.splice(allowedEmails.indexOf(email), 1);
                GM_setValue(allowedEmailsKey, allowedEmails);
                loadAllowedLists();
                populateWhitelistItems();
                updateAllDomainStates();
                channel.postMessage({ type: 'updateLists' });
            });
            whitelistItems.appendChild(listItem);
        });
    }

    // Creates a single whitelist item (reusable for both domains and emails).
    function createWhitelistItem(text, deleteCallback) {
        const listItem = document.createElement('li');
        listItem.textContent = text;
        listItem.style.cssText = `padding: 8px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = "delete-button";
        deleteButton.addEventListener('click', deleteCallback);

        listItem.appendChild(deleteButton);
        return listItem;
    }

    // --- Styles ---

    // Adds CSS styles.
    function addStyles() {
        GM_addStyle(`
            .zA.untrusted-email { background-color: #f8d7da !important; color: #000 !important; }
            .bA4, .bAK, .bAp { padding-top: 9px !important; }
            .domain-container { display: flex; align-items: center; margin-top: -4px; font-size: 10px; color: #888; width: fit-content; height: 11px; padding: 1px 2px; cursor: pointer; }
            .domain-container:hover { background-color: #b1b1b1; }
            .domain-container.not-allowed-domain:hover { background-color: #e5afaf; }
            .domain-icon { width: 10px; height: 10px; margin-right: 3px; }
            .domain-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 10px; color: inherit; }
            .not-allowed-domain { background-color: #f8d7da; color: #721c24; }
            .allowed-domain { background-color: transparent; color: inherit; }
            .custom-tooltip { position: absolute; background-color: rgba(0, 0, 0, 0.8); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; z-index: 1000; top: 40px; left: 50%; transform: translateX(-50%); opacity: 0; transition: opacity 0.3s ease-in-out; pointer-events: none; }
            .domain-container:hover .custom-tooltip { opacity: 1; }
            .detailed-tooltip { position: absolute; background-color: rgba(0, 0, 0, 0.8); color: white; padding: 5px; border-radius: 5px; z-index: 10000; font-size: 12px; }
            .panel-button { background-color: #4CAF50; color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; }
            .delete-button { background-color: #f44336; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; }
        `);
    }

    // --- Main Execution ---

    addMenuCommands();
    addStyles();

    // Adds the domain below the sender's name.
    function addDomainBelowName() {
        const nameElements = document.querySelectorAll('.bA4, .bAK, .bAp');

        nameElements.forEach((element) => {
            if (processedElements.has(element)) return;

            const emailElement = element.querySelector('[email]');
            if (!emailElement) return;

            const email = emailElement.getAttribute('email');
            let domainContainer = element.querySelector('.domain-container');
            if (!domainContainer) {
                domainContainer = createDomainContainer(email)
                element.appendChild(domainContainer);
            }
            processedElements.add(element);
        });
    }

    let mutationTimeout = null;
    const observer = new MutationObserver(() => {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => {
            addDomainBelowName();
            if (highlightUntrusted) {
                updateAllDomainStates();
            }
        }, 50);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('load', () => {
        addDomainBelowName();
        if (highlightUntrusted) {
            updateAllDomainStates();
        }
    });

})();
