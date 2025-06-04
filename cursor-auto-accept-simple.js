// Simplified Cursor Auto-Accept Script
(function() {
    'use strict';
    
    if (typeof globalThis.SimpleAutoAccept === 'undefined') {
        class SimpleAutoAccept {
            constructor(interval = 2000) {
                this.interval = interval;
                this.isRunning = false;
                this.monitorInterval = null;
                this.totalClicks = 0;
                
                // Configuration for button types
                this.config = {
                    enableAcceptAll: true,
                    enableAccept: true,
                    enableRun: true,
                    enableRunCommand: true,
                    enableApply: true,
                    enableExecute: true
                };
                
                this.log('SimpleAutoAccept initialized');
            }
            
            log(message) {
                const timestamp = new Date().toISOString();
                const prefix = '[AutoAccept]';
                const fullMessage = `${prefix} ${timestamp} - ${message}`;
                
                // Multiple logging strategies to ensure visibility
                console.log(fullMessage);
                console.info(fullMessage);
                console.warn(fullMessage);
                
                // Also try forcing to window
                try {
                    if (window.console) window.console.log(fullMessage);
                } catch (e) {
                    // Ignore
                }
                
                // Force print to console even if filtered
                try {
                    const logDiv = document.createElement('div');
                    logDiv.textContent = fullMessage;
                    logDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:black;color:white;padding:5px;z-index:99999;font-size:12px;max-width:300px;';
                    document.body.appendChild(logDiv);
                    setTimeout(() => logDiv.remove(), 3000);
                } catch (e) {
                    // Ignore
                }
            }
            
            // Find the input box and check its previous siblings for buttons
            findAcceptButtons() {
                const buttons = [];
                
                // Find the input box
                const inputBox = document.querySelector('div.full-input-box');
                if (!inputBox) {
                    this.log('Input box not found');
                    return buttons;
                }
                
                // Check previous sibling elements
                let currentElement = inputBox.previousElementSibling;
                let searchDepth = 0;
                
                while (currentElement && searchDepth < 5) {
                    // Look for any clickable elements containing "Accept" text
                    const acceptElements = this.findAcceptInElement(currentElement);
                    buttons.push(...acceptElements);
                    
                    currentElement = currentElement.previousElementSibling;
                    searchDepth++;
                }
                
                return buttons;
            }
            
            // Find accept buttons within a specific element
            findAcceptInElement(element) {
                const buttons = [];
                
                // Get all clickable elements (divs, buttons, spans with click handlers)
                const clickableSelectors = [
                    'div[class*="button"]',
                    'button',
                    'div[onclick]',
                    'div[style*="cursor: pointer"]',
                    'div[style*="cursor:pointer"]',
                    '[class*="anysphere"]',
                    '[class*="cursor-button"]',
                    '[class*="text-button"]',
                    '[class*="primary-button"]',
                    '[class*="secondary-button"]'
                ];
                
                for (const selector of clickableSelectors) {
                    const elements = element.querySelectorAll(selector);
                    for (const el of elements) {
                        if (this.isAcceptButton(el)) {
                            buttons.push(el);
                        }
                    }
                }
                
                // Also check the element itself
                if (this.isAcceptButton(element)) {
                    buttons.push(element);
                }
                
                return buttons;
            }
            
            // Check if element is an Accept button
            isAcceptButton(element) {
                if (!element || !element.textContent) return false;
                
                const text = element.textContent.toLowerCase().trim();
                
                // Check each pattern based on configuration
                const patterns = [
                    { pattern: 'accept all', enabled: this.config.enableAcceptAll },
                    { pattern: 'accept', enabled: this.config.enableAccept },
                    { pattern: 'run command', enabled: this.config.enableRunCommand },
                    { pattern: 'run', enabled: this.config.enableRun },
                    { pattern: 'apply', enabled: this.config.enableApply },
                    { pattern: 'execute', enabled: this.config.enableExecute }
                ];
                
                // Check if text matches any enabled pattern
                const matchesEnabledPattern = patterns.some(({ pattern, enabled }) => 
                    enabled && text.includes(pattern)
                );
                
                if (!matchesEnabledPattern) return false;
                
                const isVisible = this.isElementVisible(element);
                const isClickable = this.isElementClickable(element);
                
                return isVisible && isClickable;
            }
            
            // Check if element is visible
            isElementVisible(element) {
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                
                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    parseFloat(style.opacity) > 0.1 &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            }
            
            // Check if element is clickable
            isElementClickable(element) {
                const style = window.getComputedStyle(element);
                return (
                    style.pointerEvents !== 'none' &&
                    !element.disabled &&
                    !element.hasAttribute('disabled')
                );
            }
            
            // Click element with multiple strategies
            clickElement(element) {
                try {
                    const rect = element.getBoundingClientRect();
                    const x = rect.left + rect.width / 2;
                    const y = rect.top + rect.height / 2;
                    
                    // Strategy 1: Direct click
                    element.click();
                    
                    // Strategy 2: Mouse events
                    const mouseEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        clientX: x,
                        clientY: y
                    });
                    element.dispatchEvent(mouseEvent);
                    
                    // Strategy 3: Focus and Enter
                    if (element.focus) element.focus();
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        bubbles: true
                    });
                    element.dispatchEvent(enterEvent);
                    
                    this.log(`Triggered accept event: ${element.textContent.trim()}`);
                    return true;
                } catch (error) {
                    this.log(`Error clicking: ${error.message}`);
                    return false;
                }
            }
            
            // Main execution
            checkAndClick() {
                try {
                    const buttons = this.findAcceptButtons();
                    
                    if (buttons.length === 0) {
                        this.log('No accept buttons found');
                        return;
                    }
                    
                    // Click the first button found
                    const button = buttons[0];
                    const buttonText = button.textContent.trim().substring(0, 50);
                    
                    this.log(`Found button: ${buttonText}`);
                    
                    const success = this.clickElement(button);
                    if (success) {
                        this.totalClicks++;
                        this.log(`Successfully clicked accept button (Total: ${this.totalClicks})`);
                    } else {
                        this.log('Click failed');
                    }
                    
                } catch (error) {
                    this.log(`Error executing: ${error.message}`);
                }
            }
            
            start() {
                if (this.isRunning) {
                    this.log('Auto accept is already running');
                    return;
                }
                
                this.isRunning = true;
                this.totalClicks = 0;
                
                // Initial check
                this.checkAndClick();
                
                // Set interval
                this.monitorInterval = setInterval(() => {
                    this.checkAndClick();
                }, this.interval);
                
                this.log(`Auto accept started, checking every ${this.interval/1000} seconds`);
            }
            
            stop() {
                if (!this.isRunning) {
                    this.log('Auto accept is not running');
                    return;
                }
                
                clearInterval(this.monitorInterval);
                this.isRunning = false;
                this.log(`Auto accept stopped (Total clicks: ${this.totalClicks})`);
            }
            
            status() {
                return {
                    isRunning: this.isRunning,
                    interval: this.interval,
                    totalClicks: this.totalClicks,
                    config: this.config
                };
            }
            
            // Configuration control methods
            enableOnly(buttonTypes) {
                // Disable all first
                Object.keys(this.config).forEach(key => {
                    this.config[key] = false;
                });
                
                // Enable specified types
                buttonTypes.forEach(type => {
                    const configKey = `enable${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    if (this.config.hasOwnProperty(configKey)) {
                        this.config[configKey] = true;
                        this.log(`Enabled ${type} buttons`);
                    }
                });
                
                this.log(`Configuration updated: Only ${buttonTypes.join(', ')} buttons enabled`);
            }
            
            enableAll() {
                Object.keys(this.config).forEach(key => {
                    this.config[key] = true;
                });
                this.log('All button types enabled');
            }
            
            disableAll() {
                Object.keys(this.config).forEach(key => {
                    this.config[key] = false;
                });
                this.log('All button types disabled');
            }
            
            toggle(buttonType) {
                const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
                if (this.config.hasOwnProperty(configKey)) {
                    this.config[configKey] = !this.config[configKey];
                    this.log(`${buttonType} buttons ${this.config[configKey] ? 'enabled' : 'disabled'}`);
                } else {
                    this.log(`Unknown button type: ${buttonType}`);
                }
            }
            
            enable(buttonType) {
                const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
                if (this.config.hasOwnProperty(configKey)) {
                    this.config[configKey] = true;
                    this.log(`${buttonType} buttons enabled`);
                } else {
                    this.log(`Unknown button type: ${buttonType}`);
                }
            }
            
            disable(buttonType) {
                const configKey = `enable${buttonType.charAt(0).toUpperCase() + buttonType.slice(1)}`;
                if (this.config.hasOwnProperty(configKey)) {
                    this.config[configKey] = false;
                    this.log(`${buttonType} buttons disabled`);
                } else {
                    this.log(`Unknown button type: ${buttonType}`);
                }
            }
            
            // Manual search for debugging
            debugSearch() {
                this.log('=== DEBUG SEARCH ===');
                const inputBox = document.querySelector('div.full-input-box');
                if (!inputBox) {
                    this.log('No input box found');
                    return;
                }
                
                this.log('Input box found, checking siblings...');
                
                let currentElement = inputBox.previousElementSibling;
                let siblingIndex = 1;
                
                while (currentElement && siblingIndex <= 10) {
                    this.log(`Sibling ${siblingIndex}: ${currentElement.tagName} ${currentElement.className}`);
                    
                    // Check for any text content
                    const text = currentElement.textContent ? currentElement.textContent.trim() : '';
                    if (text) {
                        this.log(`  Text: "${text.substring(0, 100)}"`);
                        
                        // Check specifically for run/accept patterns
                        const patterns = ['accept', 'run', 'execute', 'apply'];
                        const foundPatterns = patterns.filter(pattern => text.toLowerCase().includes(pattern));
                        if (foundPatterns.length > 0) {
                            this.log(`  >>> Contains patterns: ${foundPatterns.join(', ')}`);
                        }
                    }
                    
                    // Check for buttons in this sibling
                    const buttons = this.findAcceptInElement(currentElement);
                    if (buttons.length > 0) {
                        this.log(`  Found ${buttons.length} clickable buttons!`);
                        buttons.forEach((btn, i) => {
                            this.log(`    Button ${i+1}: "${btn.textContent.trim().substring(0, 50)}"`);
                        });
                    }
                    
                    currentElement = currentElement.previousElementSibling;
                    siblingIndex++;
                }
                
                this.log('=== END DEBUG ===');
            }
        }
        
        globalThis.SimpleAutoAccept = SimpleAutoAccept;
    }
    
    // Initialize
    if (!globalThis.simpleAccept) {
        globalThis.simpleAccept = new globalThis.SimpleAutoAccept(2000);
        globalThis.simpleAccept.start();
        
        // Expose controls
        globalThis.startAccept = () => globalThis.simpleAccept.start();
        globalThis.stopAccept = () => globalThis.simpleAccept.stop();
        globalThis.acceptStatus = () => globalThis.simpleAccept.status();
        globalThis.debugAccept = () => globalThis.simpleAccept.debugSearch();
        
        // Force log test function
        globalThis.testLogs = () => {
            console.log('TEST LOG 1 - console.log');
            console.info('TEST LOG 2 - console.info');
            console.warn('TEST LOG 3 - console.warn');
            console.error('TEST LOG 4 - console.error');
            alert('TEST: Console logging test completed. Check console above.');
            return 'Logging test completed';
        };
        
        // Configuration controls
        globalThis.enableOnly = (types) => globalThis.simpleAccept.enableOnly(types);
        globalThis.enableAll = () => globalThis.simpleAccept.enableAll();
        globalThis.disableAll = () => globalThis.simpleAccept.disableAll();
        globalThis.toggleButton = (type) => globalThis.simpleAccept.toggle(type);
        globalThis.enableButton = (type) => globalThis.simpleAccept.enable(type);
        globalThis.disableButton = (type) => globalThis.simpleAccept.disable(type);
        
        // Force visible startup message
        const startupMsg = '[SimpleAutoAccept] SCRIPT LOADED AND ACTIVE!';
        console.log(startupMsg);
        console.info(startupMsg);
        console.warn(startupMsg);
        
        // Also create visual notification
        try {
            const notification = document.createElement('div');
            notification.textContent = '✅ AutoAccept Script Loaded! Check console for commands.';
            notification.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#4CAF50;color:white;padding:10px 20px;border-radius:5px;z-index:99999;font-weight:bold;';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
        } catch (e) {
            // Ignore
        }
        
        console.log('Commands: startAccept(), stopAccept(), acceptStatus(), debugAccept()');
        console.log('Config: enableOnly([types]), enableAll(), disableAll(), toggleButton(type)');
        console.log('Types: "acceptAll", "accept", "run", "runCommand", "apply", "execute"');
    }
})(); 