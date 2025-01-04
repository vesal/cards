function onInit() {
    new SortGame(document.getElementById('game'), window.jsframedata);
}


class SortGame {
    constructor(gameElement, data) {
        this.settings = {
            scale: 1,                    // how to scale the game area, 0.5 = 50%
            n: 8,                        // how many cards to deal
            dx: 73 + 2,                  // how much to move the decks
            numberOfPtrs: 3,             // how many pointers
            showText: 'Näytä',           // text for show button
            hideText: 'Piilota',         // text for hide button
            storageText: 'Varasto',      // text for storage deck
            recycleBinText: 'Roskis',    // text for recycle bin deck
            swapText: 'Vaihda',          // text for swap button
            pointingsText: 'Osoituksia', // text for pointer moves
            assignsText: 'Sijoituksia',  // text for assign moves
            optionsText: 'Optiot',       // text for options link
            cardsText: 'Kortteja:',      // text for card count in options
            pointersText: 'Osoittimia:', // text for pointer count in options
            dxText: 'dx:',               // text for dx in options
            newGameText: 'Jaa',          // text for new game button in options
            ptrLessText: '<',            // text for less under the pointer
            ptrGreaterText: '>',         // text for greater under the pointer
            ptrEqualText: '=',           // text for equal under the pointer
            lessText: '&#8678;',         // text for less than arrow
            greaterText: '&#8680;',      // text for greater than arrow
            equalText: '==',             // text for equal arrow
            lessTitle: 'vasemmalla pienempi;', // title for less than arrow
            greaterTitle: 'oikealla pienempi;', // title for greater than arrow
            equalTitle: 'yhtäsuuria;',   // title for equal arrow
            firstCard: null,       // card name for the left most card, like s04, rnd = random card
            firstCardBackIndex: 0, // back image index for the first card
            sortFirst: 0, // how many first cards to sort in deal deck before dealing
            compareSuits: false,   // compare suits in the pointers so c03 < h03
            pickCards: null, // what cards to pick to the top of the deal deck "s12 h01"
                             // if starts with -, put to the bottom of deal deck
            swaps: null, // what indecies to swap in the deal deck "0-1 5-8"
                         // if starts with -, swap count indecies from the end
                         // so top of deal deck. 0 is the topmost card
        }
        if (data) copyParamsValues(data.params, this.settings);
        let s = this.settings;
        setNoSelect(gameElement);
        this.gameElement = gameElement;
        // this.gameElement.style.transform = `scale(${s.scale})`;
        // this.gameElement.style.transformOrigin = 'top left';
        this.ptrs = [];
        this.table = new Table("table");
        this.ptrtable = new Table("ptrtable");

        this.scalableDiv = document.createElement('div');
        this.scalableDiv.style.position = 'absolute';
        this.scalableDiv.style.width = '100%';
        if (s.scale < 1) {
            this.scalableDiv.style.transform = `scale(${s.scale})`;
            this.scalableDiv.style.transformOrigin = 'top left';
        }
        this.gameElement.appendChild(this.scalableDiv);

        this.scalableDiv.appendChild(this.table.element);
        this.scalableDiv.appendChild(this.ptrtable.element);
        this.dealDeck = this.createDealDeck();
        this.storage = this.createStorage();
        this.recycleBin = this.createRecycleBin();
        this.createPointers(s.numberOfPtrs);
        this.moveCounter = this.createCounter('counter-move', 488, 280);
        this.assignCounter = this.createCounter('counter-swap', 568, 280);
        this.createLabel('label1', 488, 264, s.pointingsText);
        this.createLabel('label2', 568, 264, s.assignsText);
        this.createButton('button-piilota', 88, 211, 110, 50, s.hideText, this.buttonHideClick.bind(this));
        this.createButton('button-nayta', 88, 211, 110, 50, s.showText, this.buttonShowClick.bind(this));
        this.dirArrow = this.createArrow('dirArrow', 488, 211, 62, 50, '');
        this.swapButton = this.createButton('buttonSwap', 568, 211, 62, 50, s.swapText, this.buttonSwapClick.bind(this));
        this.createHiddenOptionsArea()
        this.deal(s.n);
        document.addEventListener('keydown', (event) => {
            const e = event;
            let key = event.key.toLowerCase();
            if (event.ctrlKey) key = 'c-' + key;
            if (event.shiftKey) key = 's-' + key;
            if (event.altKey) key = 'a-' + key;
            if (key === ' ') return p(e) + this.buttonSwapClick(this);  // space = vaihda
            if (key === 'a') return p(e) + this.movePtr(0, -1); // a = siirrä vasemmalle 1. ptr
            if (key === 'd') return p(e) + this.movePtr(0, 1); // d = siirrä oikealle 1. ptr
            if (key === 'q') return p(e) + this.movePtr(0, -60); // q = 1. ptr alkuun
            if (key === 'z') return p(e) + this.movePtr(0, 60); // z = 1. ptr loppuun
            if (key === 's') return p(e) + this.moveToTrash(0); // s = 1. ptr kohdata roskikseen
            if (key === 'arrowleft') return p(e) + this.movePtr(1, -1); // nuoli vasemmalle = siirrä vasemmalle 2. ptr
            if (key === 'arrowright') return p(e) + this.movePtr(1, 1); // nuoli oikealle = siirrä oikealle 2. ptr
            if (key === 'home') return p(e) + this.movePtr(1, -60); // home = 2. ptr alkuun
            if (key === 'end') return p(e) + this.movePtr(1, 60); // end = 2. ptr loppuun
            if (key === 'arrowdown') return p(e) + this.moveToTrash(1); // nuoli alas = 2. ptr kohdata roskikseen
            if (key === 'c-arrowleft') return p(e) + this.movePtr(0, -1) + this.movePtr(1, -1); // ctrl + vasen = siirrä vasemmalle molemmat ptr
            if (key === 'c-arrowright') return p(e) + this.movePtr(0, 1) + this.movePtr(1, 1); // ctrl + oikea = siirrä oikealle molemmat ptr
        });
    }

    p(event) {
        event.preventDefault();
        return 0;
    }

    clearTable() {
        const s = this.settings;
        this.scalableDiv.style.height = '220px';

        this.table.element.style.position = "absolute";
        this.table.element.style.height = "110px";
        this.table.element.style.left = "0px";
        this.table.element.style.width = "100%";

        this.ptrtable.element.style.position = "absolute";
        this.ptrtable.element.style.height = "105px";
        this.ptrtable.element.style.left = "0px";
        this.ptrtable.element.style.width = "100%";
        this.ptrtable.element.style.top = "110px";
    }

    createTopRowDecks(n) {
        const s = this.settings;
        const startx = 8;
        const dw = 73;
        const xsep = 4;
        let dx = dw + xsep;
        let x = startx;
        for (let i = 0; i <= n; i++) {  // paikka 0 on etsittävälle kortille
            const deck = new PlayingCardDeck(`deck${i}`);
            this.table.addDeck(deck);
            deck.maxCards = 1;
            setPosition(deck, x, 8);
            deck.onInsert = (_deck, _card) => {   // deck, card
                this.assignCounter.inc();
                this.checkValues();
            }
            if (dx < dw && i > 1) deck.element.style.borderLeft = "none";
            x += dx;
            dx = this.settings.dx;
        }

        this.firstDeck = this.table.decks[0];
        this.firstDeck.element.style.border = "none";
        this.firstDeck.maxCards = 0;
        this.firstDeck.onInsert = null;
        this.createFirstCard(s.firstCard);

        dx = dw + xsep;
        x = startx;
        for (let i = 0; i <= n + 1; i++) { // kaksi ylimääräistä
            const ptrdeck = new Deck(`ptrdeck${i}`);
            this.ptrtable.addDeck(ptrdeck);
            ptrdeck.element.style.border = "none";
            ptrdeck.setVisible(true);
            ptrdeck.dx = 20;
            ptrdeck.dy = 20;
            ptrdeck.onInsert = (_deck, _card) => {
                this.moveCounter.inc();
                this.checkValues();
            };
            ptrdeck.allowedFunction = (_deck, card) => {
                return (card.id.startsWith("ptr"));
            }
            setPosition(ptrdeck, x, 0);
            if (i == n) dx = dw + xsep;
            x += dx;
            dx = this.settings.dx;
        }

        const rect = this.table.element.getBoundingClientRect();
        if (s.scale * x > rect.width) {
            this.gameElement.style.width = `${s.scale * x + 10}px`;
        }

        setTimeout(() => {
            for (let i = 1; i < this.table.decks.length; i++) {
                const deck = this.table.decks[i];
                deck.animateAddCard(this.dealDeck.pop());
            }
        }, 100);

        for (let i = 0; i < this.ptrs.length; i++) {
            let target = 0;  // 2 ekaa alkuun
            if (i >= 2) target = n + 1; // loput loppuun
            /*
            let target = i % (n + 1);
            if (target > n) target = 0;
            if (i == this.ptrs.length - 1) target = n; // viimeinen ulkopuolelle
             */
            this.ptrtable.decks[target].addCard(this.ptrs[i]);
        }
        this.assignCounter.setValue(-n);
        setTimeout(() => {
            this.moveCounter.setValue(0);
        }, 2);
    }

    createFirstCard(cardName) {
        if (cardName == null || cardName.length < 2) return;
        if (cardName === "rnd") {
            cardName = cardSettings.suits[Math.floor(Math.random() * 4)] + String(Math.floor(Math.random() * 13) + 1).padStart(2, '0');
        }
        const suite = cardName[0].toLowerCase();
        if (!(cardSettings.suits.includes(suite))) return;
        const value = parseInt(cardName.substring(1));
        if (isNaN(value) || value < 1 || value > 13) return;
        const firstCard = new PlayingCard(suite, value, true);
        this.firstDeck.addCard(firstCard);
        firstCard.setBackGroundImageByIndex(this.settings.firstCardBackIndex);
        firstCard.removeAllEventListeners();
    }

    removeFirstCard() {
        const firstCard = this.firstDeck.pop();
        if (firstCard) firstCard.element.remove();
    }


    createDealDeck() {
        const table = this.gameElement;
        const dealDeck = new DealDeck('dealDeck');
        table.appendChild(dealDeck.element);
        return setPosition(dealDeck, 8, -9);
    }


    continueDeal(n) {
        this.dealDeck.onInsert = null;
        this.dealDeck.onFull = null;
        this.table.removeDecks()
        this.ptrtable.removeDecks()
        this.dealDeck.shuffle();
        this.dealDeck.sortDeck(this.settings.sortFirst, true);
        this.dealDeck.moveCardsToTop(this.settings.pickCards);
        this.dealDeck.doSwaps(this.settings.swaps);
        this.createTopRowDecks(n);
    }

    deal(n) {
        this.clearTable();
        if (this.dealDeck.cards.length >= this.dealDeck.maxCards) {
            this.continueDeal(n);
            return;
        }
        this.dealDeck.onFull = (_deck) => this.continueDeal(n);

        this.removeFirstCard(); // remove so that its is not flying to the dealdeck

        this.table.sendCards(this.dealDeck);
        this.recycleBin.sendCards(this.dealDeck);
        this.storage.sendCards(this.dealDeck);
    }


    show(visible) {
        for (let deck of this.table.decks) {
            deck.setVisible(visible);
        }
        this.storage.setVisible(visible);
        this.recycleBin.setVisible(visible);
    }

    createCounter(id, left, top) {
        const counter = new Counter(id)
        this.gameElement.appendChild(counter.element);
        return setPosition(counter, left, top);
    }

    createLabel(className, left, top, text) {
        const label = document.createElement('div');
        this.gameElement.appendChild(label);
        label.className = `label ${className}`;
        label.style.position = "absolute";
        label.style.left = `${left}px`;
        label.style.top = `${top}px`;
        label.style.color = 'black';
        label.style.fontSize = '13px';
        label.textContent = text;
    }

    createButton(className, left, top, w, h, text, onClick) {
        const button = document.createElement('button');
        button.className = `button ${className}`;
        button.style.position = "absolute";
        button.style.left = `${left}px`;
        button.style.top = `${top}px`;
        button.style.width = `${w}px`;
        button.style.height = `${h}px`;
        button.innerHTML = text;
        button.onclick = onClick;
        // button.style.color = 'black';
        this.gameElement.appendChild(button);
        return button;
    }


    createArrow(className, left, top, w, h, text) {
        // const button = this.createButton(className, left, top, w, h, text, onClick);
        const button = document.createElement('div');
        if (isIpad()) {
            button.style.padding = '0';  // for iPad
            button.style.WebkitBorderRadius = "5px";  // for iPad
        }
        button.style.fontSize = '40px';
        button.innerHTML = text;
        setElemDimensions(button, left, top, w, h);
        this.gameElement.appendChild(button);
        /*
        button.addEventListener('disabled', function() {
            button.style.opacity = '0.5';  // Optional: to visually indicate the button is disabled
        });
        */
        return button;
    }


    createStorage() {
        const storage = new PlayingCardDeck(`storage`, this.settings.storageText);
        this.gameElement.appendChild(storage.element);
        storage.element.style.backgroundColor = "#007f00";
        storage.onInsert = (_deck, _card) => {   // deck, card
            this.assignCounter.inc();
            this.checkValues();
        }
        return setPosition(storage, 224, -8);
    }

    createRecycleBin() {
        const recycleBin = new PlayingCardDeck(`recycleBin`, this.settings.recycleBinText);
        this.gameElement.appendChild(recycleBin.element);
        recycleBin.element.style.backgroundColor = "#007f00";
        recycleBin.onInsert = (_deck, _card) => {   // deck, card
            this.assignCounter.inc();
            this.checkValues();
        }
        return setPosition(recycleBin, 352, -8);
    }

    createPointers(numberOfPtrs) {
        while (this.ptrs.length > 0) {
            const ptr = this.ptrs.pop();
            ptr.element.remove();
        }
        for (let i = 0; i < numberOfPtrs; i++) {
            const img = cardSettings.ptrImages[i % cardSettings.ptrImages.length];
            const ptr = new Card(i, `ptr${i + 1}`, cardSettings.imagePath + '/' + img + 'Ptr.png', null, true);
            ptr.cropToImg();
            this.ptrs.push(ptr);
        }
    }


    buttonHideClick() {
        document.querySelector('.button-piilota').style.display = 'none';
        document.querySelector('.button-nayta').style.display = 'block';
        this.show(false);
    }

    buttonShowClick() {
        document.querySelector('.button-piilota').style.display = 'block';
        document.querySelector('.button-nayta').style.display = 'none';
        this.show(true);
    }

    getPtrIndex(ptr) {
        // id like ptrdeck0
        if (ptr == null || ptr.deck == null) return 0;
        const s = ptr.deck.element.id.substr(7);
        return parseInt(s);
    }

    buttonSwapClick() {
        const decks = this.table.decks;
        let i1 = this.getPtrIndex(this.ptrs[0]);
        let i2 = this.getPtrIndex(this.ptrs[1]);
        if (i1 === i2) return;
        // this.varasto.speed = 100;
        // this.poyta.decks[i1].speed = 100;
        // this.poyta.decks[i2].speed = 100;
        const l1 = decks[i1].cards.length;
        const l2 = decks[i2].cards.length;
        if (l1 === 0 && l2 === 0) return;
        if (l1 === 0) return decks[i1].animateAddCard(decks[i2].pop());
        if (l2 === 0) return decks[i2].animateAddCard(decks[i1].pop());

        this.storage.animateAddCard(decks[i1]?.pop() ?? null,
            (_d, _c) => decks[i1]?.animateAddCard(decks[i2]?.pop() ?? null,
                (_d, _c) => decks[i2]?.animateAddCard(this.storage.pop() ?? null,
                    (_d, _c) => null // this.swapCounter.inc()
                )
            )
        );
    }

//        this.dirArrow = this.createArrowButton('dirArrow', 488, 208, 50, 50,  '&#8678;', this.buttonLeftClick.bind(this));
//        this.swapButton = this.createButton('buttonSwap', 552, 208, 50, 50,  '&#8680;', this.buttonLeftClick.bind(this));

    movePtr(prtIndex, di) {
        let i = this.getPtrIndex(this.ptrs[prtIndex]);
        i += di;
        if (i < 0) i = 0;
        if (i > this.ptrtable.decks.length - 1) i = this.ptrtable.decks.length - 1;
        this.ptrtable.decks[i].addCard(this.ptrs[prtIndex]);
        return 0;
    }

    moveToTrash(ptrIndex) {
        let i = this.getPtrIndex(this.ptrs[ptrIndex]);
        if (i === 0) return 0;
        const card = this.table.decks[i].pop();
        // if (card == null) return 0;
        // this.table.decks[i].removeCard(card);
        this.recycleBin.addCard(card);
        return 0;
    }

    checkValues() {
        let s = this.settings;
        let i1 = this.getPtrIndex(this.ptrs[0]);
        let i2 = this.getPtrIndex(this.ptrs[1]);
        if (i1 > i2) {
            let tmp = i1;
            i1 = i2;
            i2 = tmp;
        }
        const deck1 = this.table.decks[i1];
        const deck2 = this.table.decks[i2];
        const card1 = deck1 ? deck1.peek() : null;
        const card2 = deck2 ? deck2.peek() : null;
        const diff = Card.compareCards(card1, card2, s.compareSuits);

        //this.leftArrow.disabled = true;
        //this.rightArrow.disabled = true;
        // if (value1 < value2) this.leftArrow.disabled = false;
        // if (value2 < value1) this.rightArrow.disabled = false;
        this.dirArrow.innerHTML = diff < 0 ? s.lessText : diff === 0 ? s.equalText : s.greaterText;
        this.dirArrow.title = diff < 0 ? s.lessTitle : diff === 0 ? s.equalTitle : s.greaterTitle;
        for (let ptrDeck of this.ptrtable.decks) {
            ptrDeck.setCenterText(" ");
            ptrDeck.setTextSize("40px");
            ptrDeck.setTextTop("80%")
            ptrDeck.setTextLeft("30%")
        }
        let ptrDec1 = this.ptrtable.decks[i1];
        let ptrDec2 = this.ptrtable.decks[i2];
        if (diff < 0) {
            ptrDec1.setCenterText(s.ptrLessText);
            ptrDec2.setCenterText(s.ptrGreaterText)
        } else if (diff > 0) {
            ptrDec1.setCenterText(s.ptrGreaterText)
            ptrDec2.setCenterText(s.ptrLessText)
        } else {
            ptrDec1.setCenterText(s.ptrEqualText)
            ptrDec2.setCenterText(s.ptrEqualText)
        }
        const color1 = card1 ? card1.color : "green";
        const color2 = card2 ? card2.color : "green";
        ptrDec1.setTextColor(color1);
        ptrDec2.setTextColor(color2);
    }

    createHiddenOptionsArea() {
        // Create hidden area container
        const hiddenArea = document.createElement('div');
        hiddenArea.id = 'hidden-area';
        hiddenArea.className = 'hidden-area';
        hiddenArea.style.display = 'none';
        hiddenArea.style.position = 'absolute';
        hiddenArea.style.top = '320px';
        hiddenArea.style.left = '20px';
        hiddenArea.style.backgroundColor = 'white';
        hiddenArea.style.border = '1px solid black';
        hiddenArea.style.padding = '10px';
        hiddenArea.style.zIndex = '1000';

        function createInput(labelText, inputId, inputName, defaultValue) {
            const label = document.createElement('label');
            label.htmlFor = inputId;
            label.style.color = 'black';
            label.textContent = labelText;
            hiddenArea.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.id = inputId;
            input.name = inputName;
            input.style.width = "2em";
            input.style.marginLeft = "0.3em";
            input.style.marginRight = "1em";
            input.value = defaultValue;
            hiddenArea.appendChild(input);
            return input;
        }

        let s = this.settings;
        this.cardCountInput = createInput(s.cardsText, 'card-count', 'card-count', s.n);
        this.pointerCountInput = createInput(s.pointersText, 'pointer-count', 'pointer-count', s.numberOfPtrs);
        this.dxInput = createInput(s.dxText, 'dx', 'dx', s.dx);

        // Create "Jaa" button
        const jaaButton = document.createElement('button');
        jaaButton.id = 'new-game-button';
        jaaButton.textContent = s.newGameText;
        jaaButton.onclick = this.handleJaaButtonClick.bind(this);
        hiddenArea.appendChild(jaaButton);

        // Append hidden area to the game element
        this.gameElement.appendChild(hiddenArea);

        // Create "Optiot" link
        const optionsLink = document.createElement('a');
        optionsLink.href = '#';
        optionsLink.textContent = s.optionsText;
        setElemPosition(optionsLink, 90, 290);
        optionsLink.style.fontSize = '12px';
        optionsLink.onclick = (event) => {
            event.preventDefault();
            this.toggleHiddenArea();
        };
        this.gameElement.appendChild(optionsLink);
    }

    toggleHiddenArea() {
        const hiddenArea = document.getElementById('hidden-area');
        if (hiddenArea.style.display === 'none' || hiddenArea.style.display === '') {
            hiddenArea.style.display = 'block';
        } else {
            hiddenArea.style.display = 'none';
        }
    }

    parseValue(elem, defaultValue, maxValue) {
        let value = parseInt(elem.value);
        if (isNaN(value)) {
            elem.value = "" + defaultValue;
            return defaultValue;
        }
        if (value > maxValue) {
            elem.value = "" + maxValue;
            value = maxValue;
        }
        return value;
    }

    handleJaaButtonClick() {
        const cardCount = this.parseValue(this.cardCountInput, 8, 52);
        const pointerCount = this.parseValue(this.pointerCountInput, 3, 52);
        this.settings.dx = this.parseValue(this.dxInput, 73, 100);
        this.buttonHideClick()
        this.toggleHiddenArea()
        this.createPointers(pointerCount);
        this.deal(cardCount);
    }
}


/**
 * Dummy function to prevent default action
 * @param {Object} event - event to prevent default action
 */
function p(event) {
    event.preventDefault();
    return 0;
}

