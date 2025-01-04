/**
 * Global settings for cards and decks
 */
const cardSettings = {
    // Where to find card images. Image names should be like s01, h13, d07, c11
    imagePath: 'https://tim.jyu.fi/files/common/images/cards',
    // see https://tekeye.uk/playing_cards/svg-playing-cards?

    // Names of pointer images
    ptrImages: ['lred', 'lblack', 'lyellow', 'blue', 'orange', 'green', 'black', 'red', 'lyellow', 'bblack', 'bred'],

    // Names for background images
    bgImages: ["back1", "back2", "back3", "back4", "back5", "back6", "back7", "back8", "back9", "back10", "back11", "back12", "back13"],
    // What background image to use from bgImages
    bgIndex:  11,

    deckWidth: "73px",  // width of the deck
    deckHeight: "98px", // height of the deck
    suits: "csdh",      // suit order in comaprision
}

const ruleAny = -20;

/**
 * Set object value from another object
 * @param objTo to what object to set
 * @param key string fo key to set
 * @param objFrom from what object to take the value
 */
function setObjectValue(objFrom, key, objTo) {
    if (objFrom == null || typeof objFrom !== 'object' || Array.isArray(objFrom)) return;
    if (objTo == null || typeof objTo !== 'object' || Array.isArray(objTo)) return;
    if (!key in objFrom) return;
    objTo[key] = objFrom[key];
}

/**
 * Copy object values from one object to another
 * If the value is on cardSettings, it is copied to that object
 * @param params where to copy from
 * @param objTo where to copy to if not in cardSettings, if null just use cardSettings
 */
function copyParamsValues(params, objTo=null) {
    if (params == null || typeof params !== 'object' || Array.isArray(params)) return;
    if (objTo == null || typeof objTo !== 'object' || Array.isArray(objTo)) objTo = null;
    for (let key in params) {
        let to = cardSettings;
        if (!(key in to)) to = objTo;
        if (to != null) to[key] = params[key];
    }
}

/**
 * Set component (assume has comp.element) absolute position
 * @param comp what component position to set
 * @param x left postion for the comp.element
 * @param y top position for the comp.element, if < 0 use bottom
 * @returns comp for chaining
 */
function setPosition(comp, x, y) {
    const elem = comp.element;
    if (elem == null) return comp;
    setElemPosition(elem, x, y);
    return comp;
}


/**
 * Set element absolute position
 * @param elem what element position to set
 * @param x left postion for the element
 * @param y top position for the element, if < 0 use bottom
 * @returns elem for chaining
 */
function setElemPosition(elem, x, y) {
    if (elem == null) return elem;
    elem.style.position = "absolute";
    elem.style.left = `${x}px`;
    if (y>=0) {
        elem.style.top = `${y}px`;
        elem.style.bottom = `unset`;
    }
    else {
        elem.style.top = `unset`;
        elem.style.bottom = `${-y}px`;
    }
    return elem;
}


/**
 * Set so that element cannot be selected
 * @param elem what element to set
 * @returns elem for chaining
 */
function setNoSelect(elem) {
    elem.style.userSelect = "none";
    elem.style.webkitUserSelect = "none";
    elem.style.MozUserSelect = "none";
    elem.style.msUserSelect = "none";
    return elem;
}


/**
 * Set element dimensions
 * @param elem what element dimensions to set
 * @param x left postion for the element
 * @param y top position for the element if < 0 use bottom
 * @param w width for the element
 * @param h height for the element
 * @returns elem for chaining
 */
function setElemDimensions(elem, x, y, w, h) {
    if (elem == null) return elem;
    elem.style.width = `${w}px`;
    elem.style.height = `${h}px`;
    return setElemPosition(elem, x, y);
}


/**
 * Check if device is iPad
 * @returns true if ipad
 */
function isIpad() {
    return /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
}


/**
 * Parse integer from string, if not a number return default value
 * @param s string to parse
 * @param defaultValue value to return if not a number
 * @returns parse value or default value
 */
function safeParseInt(s, defaultValue = -1) {
    const result = parseInt(s);
    return isNaN(result) ? defaultValue : result;
}


function debugClear() {
    const debugElement = document.getElementById('debug');
    debugElement.innerHTML = '';
}


function debugLog(message) {
    const debugElement = document.getElementById('debug');
    // const logMessage = debugElement; // document.createElement('div');
    // logMessage.textContent = message;
    // debugElement.appendChild(logMessage);
    debugElement.style.position = 'absolute';
    debugElement.style.top = '100px';
    debugElement.innerHTML += "<br>" + message;
}


/**
 * Class for general card. Has drag and drop functionality.
 * Should have element for html element.
 */
class Card {
    constructor(value, id, img1, img2, visible) {
        this.img = [img2, img1];
        this.value = value;
        this.id = id;
        this.visible = visible ? 1 : 0;
        this.element = this.createCardElement();
        this.element.cardInstance = this;
        this.deck = null;
        this.tapHandler = null;  // mimic click event
        this.touchMode = 0; // 1 = start, 2 = move, 0 = none, mimic click event
    }

    createCardElement() {
        const cardElem = document.createElement('div');
        cardElem.classList.add('card');
        cardElem.draggable = true;
        cardElem.id = this.id;

        const img = document.createElement('img');
        cardElem.img = img;
        cardElem.img.src = this.img[this.visible];
        cardElem.img.draggable = false;

        cardElem.appendChild(img);

        cardElem.addEventListener('dragstart', (event) => this.handleDragStart(event));
        cardElem.addEventListener('dragend', (event) => this.handleDragEnd(event));
        // document.addEventListener('drag', (event) => this.handleDragMove(event));
        cardElem.addEventListener('touchstart', (event) => this.handleTouchStart(event));
        cardElem.addEventListener('touchmove', (event) => this.handleTouchMove(event));
        cardElem.addEventListener('touchend', (event) => this.handleTouchEnd(event));
        cardElem.addEventListener('click', (_event) => this.tap());

        // Firefox ei anna oiketa koordinaatteja drag-tapahtumasta
        document.addEventListener('dragover', (event) => this.handleDragMove(event));

        return cardElem;
    }


    removeAllEventListeners() {
        /*
        const cardElem = this.element.cloneNode(true);
        this.element.replaceWith(cardElem);
        this.element = cardElem;
         */

        this.element.draggable = false;
    }

    setBackGroundImage(img) {
        this.img[0] = img;
        this.element.img.src = this.img[this.visible];
    }

    setBackGroundImageByIndex(imgIndex) {
        this.setBackGroundImage(`${cardSettings.imagePath}/${cardSettings.bgImages[imgIndex]}.png`);
    }

    debugE(event) {
        debugLog(``+
            `e: ${event.clientX},${event.clientY} <br>`+
            `p: ${event.pageX},${event.pageY}<br>` +
            `s: ${event.screenX},${event.screenY}<br>` +
            `x: ${event.x},${event.y}<br>`
        )
    }

    setVisible(visible) {
        this.visible = visible ? 1 : 0;
        this.element.img.src = this.img[this.visible];
        this.element.img.style.display = "unset";
    }

    handleDragStart(event) {
        if (!this.element.draggable) return;
        // event.preventDefault();   // jos päällä Safari maalaa
        // this.startDrag(event, event.offsetX, event.offsetY);
        // this.debugE(event);
        this.startDrag(event, event.clientX, event.clientY, event.offsetX, event.offsetY);
    }

    handleDragEnd(event) {
        if (!this.element.draggable) return;
        event.preventDefault();
        // this.debugE(event);
        // this.endDrag(event, event.clientX, event.clientY);
        this.endDrag(event, this.element.lastClientX, this.element.lastClientY); // Mac Safari tarvitsee tämän
    }

    handleTouchStart(event) {
        if (!this.element.draggable) return;
        event.preventDefault();
        this.touchMode = 1; // 1 = start, 2 = move, 0 = none, mimic ckick event

        const touch = event.touches[0];
        const rect = touch.target.getBoundingClientRect();
        this.offsetX = touch.clientX - rect.left;
        this.offsetY = touch.clientY - rect.top;
        // do not start drag yet, if it is just click, first move starts
    }


    handleDragMove(event) {
        if (!this.element.draggable) return;
        // this.debugE(event);
        this.moveDrag(event.clientX, event.clientY);
    }

    handleTouchMove(event) {
        if (!this.element.draggable) return;
        // debugLog(`${event.clientX},${event.clientY} - ${event.pageX},${event.pageY}`)
        event.preventDefault();
        const touch = event.touches[0];
        this.touchMode++;
        if (this.touchMode === 3) { // if first move, start drag
            this.startDrag(event, touch.clientX, touch.clientY, this.offsetX, this.offsetY);
            this.touchMode++;
        } else
        this.moveDrag(touch.clientX, touch.clientY);
    }

    handleTouchEnd(event) {
        if (!this.element.draggable) return;
        const touch = event.changedTouches[0];
        if (this.touchMode && this.touchMode <= 2) { // Consider it a tap if no touch move
            this.tap();
            return;
        }

        this.endDrag(event, touch.clientX, touch.clientY);
    }

    tap() {
        if (this.tapHandler) this.tapHandler(this);
        if (this.deck) this.deck.tap(this);
    }

    startDrag(event, clientX, clientY, offsetX, offsetY) {
        const cardElem = this.element;
        cardElem.offsetX = offsetX;
        cardElem.offsetY = offsetY;
        const dragImage = cardElem.img.cloneNode(true);
        document.body.appendChild(dragImage);
        dragImage.style.position = 'absolute';
        dragImage.style.left = `${clientX - offsetX}px`;
        dragImage.style.top = `${clientY - offsetY}px`;
        dragImage.style.pointerEvents = 'none';
        dragImage.style.opacity = '1';
        dragImage.id = cardElem.id;
        cardElem.touchFeedback = dragImage;

        // Create an invisible element to use as the drag image
        // Does not work with Mac Safari
        const invisibleImage = document.createElement('div');
        invisibleImage.style.width = '1px';
        invisibleImage.style.height = '1px';
        invisibleImage.style.opacity = '0';
        document.body.appendChild(invisibleImage);

        if (event.dataTransfer) {
            // event.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
            event.dataTransfer.setDragImage(invisibleImage, 0, 0);
        }

        setTimeout(() => {
            document.body.appendChild(cardElem);
            // cardElem.img.classList.add("hidden");
            cardElem.img.style.display = "none";
            invisibleImage.remove();
        }, 0);
    }

    moveDrag(clientX, clientY) {
        // debugClear();
        // debugLog(`${clientX},${clientY}`)
        if (clientX != 0 && clientY != 0) {
            this.element.lastClientX = clientX; // Maciä varten kun Safarissa endDrag cliect? toimii väärinpäin
            this.element.lastClientY = clientY;
        }
        const cardElem = this.element;
        if (cardElem.touchFeedback) {
            cardElem.touchFeedback.style.left = `${clientX - cardElem.offsetX}px`;
            cardElem.touchFeedback.style.top = `${clientY - cardElem.offsetY}px`;
        }
    }

    endDrag(event, clientX, clientY) {
        const card = this;
        const cardElem = card.element;
        // cardElem.img.classList.remove('hidden');
        cardElem.img.style.display = "unset";
        if (cardElem.touchFeedback) {
            document.body.removeChild(cardElem.touchFeedback);
            cardElem.touchFeedback = null;
        }

        // debugLog(`${event.pageX},${event.pageY}, ${event.screenX},${event.screenY}`);
        // const elementsUnderCursor = document.elementsFromPoint(clientX, clientY);
        const elementsUnderCursor = document.elementsFromPoint(clientX, clientY);
        const targetDeckElem = elementsUnderCursor.find(el => el.classList.contains('deck'));

        let deck = card.deck;
        if (targetDeckElem) {
            const targetDeck = targetDeckElem.deckInstance;
            if (targetDeck.isAllowedToDrop(card))
                deck = targetDeck;
        }

        let np = deck.nextCardPosition();
        let deckRect = deck.element.getBoundingClientRect();
        const dx = clientX - cardElem.offsetX - (deckRect.left + np.x);
        const dy = clientY - cardElem.offsetY - (deckRect.top + np.y);
        // const dropX = clientX - deckRect.left;
        // const dropY = clientY - deckRect.top;
        // debugLog(`${clientX},${clientY} -> ${dropX},${dropY} / ${cardElem.offsetX},${cardElem.offsetY}`)

        let s = Math.sqrt(dx * dx + dy * dy);
        let t = Math.min(s / deck.speed,2);

        cardElem.style.position = 'absolute';
        cardElem.style.left = `${clientX - cardElem.offsetX}px`;
        cardElem.style.top = `${clientY - cardElem.offsetY}px`;
        cardElem.style.transition = `transform ${t}s ease`;
        cardElem.style.transform = `translate(${-dx}px, ${-dy}px)`;
        setTimeout(() => {
            cardElem.style.transition = '';
            cardElem.style.transform = '';
            deck.addCard(card);
        }, Math.round(t * 1000));
    }

    cropToImg() {
        const img = this.element.img;
        img.onload = () => {
            this.updateElementSize(img);
        };
        if (img.complete) {
            img.onload(img);
        }
    }

    updateElementSize(img) {
        const rect = img.getBoundingClientRect();
        this.element.style.width = `${rect.width}px`;
        this.element.style.height = `${rect.height}px`;
    }

    static compareCards(a, b, useSuit = false) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;
        if (a.value < b.value) return -1;
        if (a.value > b.value) return 1;
        if (!useSuit  || !a.suit || !b.suit) return 0;
        const ai = cardSettings.suits.indexOf(a.suit);
        const bi = cardSettings.suits.indexOf(b.suit);
        if (ai < bi) return -1;
        if (ai > bi) return 1;
        return 0;
    }
}


class PlayingCard extends Card {
    constructor(suit, value, visible) {
        const formattedValue = value < 10 ? `0${value}` : value;
        const id = `${suit}${formattedValue}`;
        const img1 = `${cardSettings.imagePath}/${id}.png`;
        const img2 = `${cardSettings.imagePath}/${cardSettings.bgImages[cardSettings.bgIndex]}.png`;
        super(value, id, img1, img2, visible);
        this.value = value;
        this.suit = suit;
        this.color = suit === 'c' || suit === 's' ? 'black' : 'red';
        this.element = this.createCardElement();
        this.element.cardInstance = this;
    }
}


class Deck {
    constructor(elementId, text) {
        this.maxCards = 10000;
        this.visible = false;
        this.element = this.createDeckElement(elementId);
        this.element.classList.add('deck');
        this.element.deckInstance = this;
        this.cards = [];
        this.addEventListeners();
        this.speed = 500;
        this.textElement = null;
        this.setCenterText(text);
        this.onInsert = null;
        this.onFull = null;
        this.allowedFunction = null;
        this.dx = 0;
        this.dy = 0;
        this.id = elementId;
        this.tapHandler = null;
    }

    createDeckElement(elementId) {
        const deckElement = document.createElement('div');
        deckElement.id = elementId;
        deckElement.style.position = "absolute";
        deckElement.style.top = "0";
        deckElement.style.left = "0";
        deckElement.style.width = cardSettings.deckWidth;
        deckElement.style.height = cardSettings.deckHeight;
        deckElement.style.border = "1px solid black";
        deckElement.draggable = false;
        return deckElement;
    }

    tap(card) {
        if (this.tapHandler) this.tapHandler(this, card);
    }

    addEventListeners() {
        this.element.addEventListener('dragover', (event) => {
            event.preventDefault();
        });
    }


    isAllowedToDrop(card) {
        if (this.cards.length >= this.maxCards) return false;
        if (!this.allowedFunction) return true;
        return this.allowedFunction(this, card);
    }

    nextCardPosition(delta = 0) {
        let n = this.cards.length + delta;
        return {x: n * this.dx, y: n * this.dy};
    }


    addCard(card) {
        if (!card) return;
        if (card.deck) card.deck.removeCard(card);
        this.cards.push(card);
        this.element.appendChild(card.element);
        card.element.style.position = 'absolute';
        let np = this.nextCardPosition(-1);
        card.element.style.left = np.x + 'px';
        card.element.style.top = np.y + 'px';
        card.deck = this;
        card.setVisible(this.visible);
        // seuraava on siksi että saadaan talteen kortin alkuperäinen sijainti
        // se katoaa muuten kun kortti siirretään pakasta toiseen
        setTimeout(() => {
            const rect = card.element.getBoundingClientRect();
            card.oldRect = {
                top: rect.top,
                right: rect.right,
                bottom: rect.bottom,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                x: rect.x,
                y: rect.y
            };
            if (this.onInsert) this.onInsert(this, card);
            if (this.cards.length >= this.maxCards && this.onFull) this.onFull(this);
        }, 0);
    }

    animateAddCard(card, onArrival = null) {
        if (!card) {
            if (onArrival) onArrival(this, card);
            return;
        }
        if (card.deck) card.deck.removeCard(card);

        const startX = card.oldRect.left;
        const startY = card.oldRect.top;
        const endX = this.element.getBoundingClientRect().left;
        const endY = this.element.getBoundingClientRect().top;

        card.element.style.position = 'absolute';
        card.element.style.left = `${startX}px`;
        card.element.style.top = `${startY}px`;
        document.body.appendChild(card.element);

        const dx = startX - endX;
        const dy = startY - endY;

        let s = Math.sqrt(dx * dx + dy * dy);
        let t = Math.min((s / this.speed), 2).toFixed(1);

        let transitionHandled = false;
        const onTransitionEnd = () => {
            if (transitionHandled) return;
            transitionHandled = true;
            card.element.style.transition = '';
            card.element.style.transform = '';
            this.addCard(card);
            if (onArrival) onArrival(this, card);
            card.element.removeEventListener('transitionend', onTransitionEnd);
        };
        card.element.addEventListener('transitionend', onTransitionEnd, {once: true});

        setTimeout(() => { // if transition does not alert on end
            onTransitionEnd();
        }, t * 1000 + 100); // Add a small buffer to the timeout

        card.element.offsetHeight; // Force reflow to ensure transition is applied

        setTimeout(() => { // ilman tätä viivettä ei toinen siirto lähtenyt
            requestAnimationFrame(() => {
                card.element.style.transition = `transform ${t}s ease`;
                card.element.style.transform = `translate(${(-dx).toFixed(0)}px, ${(-dy).toFixed(0)}px)`;
            });
        }, 0);
    }


    removeCard(card, updateDisplay = true) {
        const index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }
        if (updateDisplay) this.updateDeckDisplay();
    }


    moveCardsToTop(pickCardsString) {
        if (!pickCardsString) return;
        let dir = 0;
        if (pickCardsString[0] === '-') {
            dir = 1;
            pickCardsString = pickCardsString.substring(1);
        }
        pickCardsString = pickCardsString.trim();
        const cardIds = pickCardsString.toLowerCase().split(/[ ,;]/).filter(Boolean);
        for (let i = cardIds.length-1; i >= 0; i--) {
            const cardId = cardIds[i];
            const index = this.cards.findIndex(c => c.id === cardId);
            if (index < 0) continue;
            const card = this.cards[index];
            this.cards.splice(index, 1);
            if (dir == 0) this.cards.push(card);
            else this.cards.unshift(card);
        }
        this.updateDeckDisplay();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        this.updateDeckDisplay();
    }


    updateDeckDisplay() {
        for (let elem of  this.element.children) {
            if (!elem.classList.contains('card')) continue;
            this.element.removeChild(elem);
        }
        for (let card of this.cards) {
            this.element.appendChild(card.element);
        }
        for (let i = 0; i < this.cards.length; i++) {
            this.cards[i].element.style.top = i * this.dy + 'px';
            this.cards[i].element.style.left = i * this.dx + 'px';
        }
    }

    pop() {
        if (this.cards.length === 0) {
            return null;
        }
        const topCard = this.cards.pop();
        this.element.removeChild(topCard.element);
        topCard.deck = null;
        return topCard;
    }

    setCenterText(text) {
        if (!text) return;
        let textElement = this.textElement
        if (!textElement) {
            textElement = document.createElement('div');
            textElement.className = 'center-text';
            this.element.appendChild(textElement);
            textElement.style.position = 'absolute';
            textElement.style.top = '50%';
            textElement.style.left = '50%';
            textElement.style.transform = 'translate(-50%, -50%)';
            textElement.style.pointerEvents = 'none'; // Ensure it doesn't interfere with card interactions
            textElement.style.color = 'black';
            this.textElement = textElement;
        }
        textElement.textContent = text;
    }

    setTextSize(size) {
        if (!this.textElement) return;
        this.textElement.style.fontSize = size;
    }

    setTextTop(size) {
        if (!this.textElement) return;
        this.textElement.style.top = size;
    }

    setTextLeft(size) {
        if (!this.textElement) return;
        this.textElement.style.left = size;
    }

    setTextColor(color) {
        if (!this.textElement) return;
        this.textElement.style.color = color;
    }

    setVisible(visible) {
        this.visible = visible;
        for (let card of this.cards) card.setVisible(visible);
    }

    peek() {
        if (this.cards.length === 0) return null;
        return this.cards[this.cards.length - 1];
    }

    peekValue() {
        const card = this.peek();
        if (!card) return -100000;
        return card.value;
    }

    sendCards(targetDeck) {
        while (this.cards.length > 0) {
            targetDeck.animateAddCard(this.pop());
        }
    }

    sortDeck(sortFirst = 0, useSuit = false) {
        if (!sortFirst) return;
        let n = sortFirst;
        let dir = -1;
        if (n < 0) {
            n = -n;
            dir = 1;
        }
        if (n <= 1) return;
        if (n > 52) n = 52;
        // sort only this.settings.sortFirst first cards
        const topCards = this.cards.slice(-n);
        topCards.sort((a, b) => { return dir*Card.compareCards(a, b, useSuit);});
        this.cards = this.cards.slice(0, -n).concat(topCards);
        this.updateDeckDisplay();
    }

    doSwaps(swapsString) {
        if (!swapsString) return;
        let dir = 0;
        if (swapsString[0] === '-')  {
            dir = this.cards.length - 1;
            swapsString = swapsString.substring(1);
        }
        swapsString = swapsString.trim();
        const swaps = swapsString.toLowerCase().split(/[ ,;]/).filter(Boolean);
        for (let swap of swaps) {
            const [s1, s2] = swap.split('-');
            let i1 = safeParseInt(s1);
            let i2 = safeParseInt(s2);
            if (i1 < 0 || this.cards.length <= i1) continue;
            if (i2 < 0 || this.cards.length <= i2) continue;
            if (dir) {
                i1 = dir - i1;
                i2 = dir - i2;
            }
            [this.cards[i1], this.cards[i2]] = [this.cards[i2], this.cards[i1]];
        }
        this.updateDeckDisplay();
    }

}


class PlayingCardDeck extends Deck {
    constructor(elementId, text) {
        super(elementId, text);
    }

    isAllowedToDrop(card) {
        if (!(card instanceof PlayingCard)) return false;
        return super.isAllowedToDrop(card);
    }
}

class DealDeck extends PlayingCardDeck {
    constructor(elementId) {
        super(elementId);
        this.element.classList.add('dealdeck');
        this.maxCards = 52;
        this.createDeck();
    }

    createDeck() {
        const suits = ['c', 'd', 's', 'h'];
        this.maxCards = 0;
        for (let suit of suits) {
            for (let value = 1; value <= 13; value++) {
                const card = new PlayingCard(suit, value, false);
                this.addCard(card);
                this.maxCards++;
            }
        }
    }
}


class RuleDeck extends PlayingCardDeck {
    constructor(elementId, text, rules) {
        super(elementId, text);
        this.element.classList.add('ruledeck');
        this.rules = rules;
    }

    isAllowedToDrop(card) {
        if (!super.isAllowedToDrop(card)) return false;
        const topCard = this.peek();
        if (!topCard) { // emtpy deck
            if (this.rules.first === ruleAny) return true;
            return card.value === this.rules.first;
        }
        if (this.rules.diff === ruleAny) return true;
        if (topCard.value === this.rules.end)   // new round?
            return card.value === this.rules.nextFirst;
        return card.value === topCard.value + this.rules.diff;
    }
}


class Table {
    constructor(elementId, visible) {
        this.element = this.createTableElement(elementId);
        this.element.classList.add('table');
        this.element.poytaInstance = this;
        this.decks = [];
        this.dx = 0;
        this.dy = 0;
        this.mx = 0; // margin X for first deck
        this.my = 0; // margin Y
        this.visible = visible;
    }

    createTableElement(elementId) {
        const tableElement = document.createElement('div');
        tableElement.id = elementId;
        tableElement.style.color = "#009F00";
        return tableElement;
    }

    addDeck(deck) {
        deck.setVisible(this.visible);
        this.decks.push(deck);
        this.element.appendChild(deck.element);
        deck.element.style.position = "absolute";
        const n = this.decks.length - 1;
        deck.element.style.top = this.mx + n * this.dy + 'px';
        deck.element.style.left = this.my + n * this.dx + 'px';
    }

    removeDeck(deck) {
        const index = this.decks.indexOf(deck);
        if (index > -1) {
            this.decks.splice(index, 1);
            this.element.removeChild(deck.element);
        }
    }

    removeDecks() {
        while (this.decks.length > 0) {
            this.removeDeck(this.decks[this.decks.length - 1]);
        }
    }

    setVisible(visible) {
        this.visible = visible;
        for (let deck of this.decks) deck.setVisible(visible);
    }

        sendCards(targetDeck) {
            for (let deck of this.decks) {
                deck.sendCards(targetDeck);
            }
        }
}


class Counter {
    constructor(id) {
        this.value = 0;
        this.id = id;
        this.element = this.createCounterElement(id);
        this.element.classList.add('counter');
        this.setValue(0);
    }

    createCounterElement(id) {
        const element = document.createElement('div');
        element.id = id;
        element.style.position = "absolute";
        element.style.color = 'black';
        element.style.backgroundColor = 'aqua';
        element.style.width = "60px";
        element.style.height = "30px";
        element.textContent = "0";
        element.style.textAlign = "center";
        element.style.lineHeight = "30px";
        element.style.fontSize = "25px";
        element.style.fontWeight = "bold";
        return element;
    }

    setValue(value) {
        this.value = value;
        this.element.textContent = value;
    }

    inc() {
        this.setValue(this.value + 1);
    }
}