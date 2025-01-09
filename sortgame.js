function onInit() {
    if (window.sortgame) return;
    window.sortgame = new SortGame(document.getElementById('game'), window.jsframedata, window.initData);
}


function setData(data) {
    if (!window.sortgame) onInit();  // varulta
    window.sortgame.setData(data);
}


function saveData(data) {
    if (window.self === window.top) {  //  lokaali ajo
        console.log('saveData', data);
    }
    else
        window.port2.postMessage({ msg: "datasave", data: {  ...data } });
}


function getData() {
    return window.sortgame.getData();
}


function updateData(data) {
    if (window.self === window.top) {  //  lokaali ajo
        console.log('updateData', data);
    }
    else  window.port2.postMessage({ msg: "update", data: {  ...data } });
}

sortGameTranslations = {
    en: {
        showText: 'Show',                 // text for show button
        hideText: 'Hide',                 // text for hide button
        storageText: 'Storage',           // text for storage deck
        recycleBinText: 'Trash',          // text for recycle bin deck
        swapText: 'Swap',                 // text for swap button
        pointingsText: 'Pointings',       // text for pointer moves
        assignsText: 'Assignments',       // text for assign moves
        optionsText: 'Options',           // text for options link
        cardsText: 'Cards:',              // text for card count in options
        pointersText: 'Pointers:',        // text for pointer count in options
        dxText: 'dx:',                    // text for dx in options
        newGameText: 'Deal',              // text for new game button in options
        lessTitle: 'left is smaller',     // title for less than arrow
        greaterTitle: 'right is smaller', // title for greater than arrow
        equalTitle: 'equals',             // title for equal arrow
    },
}


class SortGame {
    constructor(gameElement, data, initData) {
        this.settings = {
            lang: "fi",                  // laguage, fi, en
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
            lessTitle: 'vasemmalla pienempi ', // title for less than arrow
            greaterTitle: 'oikealla pienempi', // title for greater than arrow
            equalTitle: 'yhtäsuuria',    // title for equal arrow
            ptrLessText: '<',            // text for less under the pointer
            ptrGreaterText: '>',         // text for greater under the pointer
            ptrEqualText: '=',           // text for equal under the pointer
            lessText: '<',               // text for less than arrow
            greaterText: '>',            // text for greater than arrow
            equalText: '==',             // text for equal arrow
            movableDirArrow: true,       // if true, the sign moves between the pointers
            dirArrowY: -10,              // y position for the direction arrow (affected when movableDirArrow)
            dirArrowX: -10,              // x position for the direction arrow (affected when movableDirArrow)
            dealToStorage: false,        // if true, deal to storage deck
            startOpen: false,            // if true, start with open cards
            firstCard: null,       // card name for the left most card, like s04, rnd = random card
            firstCardBackIndex: 0, // back image index for the first card
            sortFirst: 0, // how many first cards to sort in deal deck before dealing
            compareSuits: false,   // compare suits in the pointers so c03 < h03
            pickCards: null, // what cards to pick to the top of the deal deck "s12 h01"
                             // if starts with -, put to the bottom of deal deck
            swaps: null, // what indecies to swap in the deal deck "0-1 5-8"
                         // if starts with -, swap count indecies from the end
                         // so top of deal deck. 0 is the topmost card
            task: false, // if false, the game is not a task, so no need to save the data

        }
        if (data) {
            const lang = data.params?.lang ?? 'fi';
            Object.assign(this.settings, sortGameTranslations[lang] ?? {}, );
            copyParamsValues(data.params, this.settings);
        }
        this.settingData = false; // use this to prevent extra events when setting data
        this.movedWhileNotHidden = false;
        this.initData = (initData && initData.c !== undefined) ? initData : null;
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
        this.moveCounter = this.createCounter('counter-move', 488, 280);
        this.assignCounter = this.createCounter('counter-assign', 568, 280);
        this.createLabel('label1', 488, 264, s.pointingsText);
        this.createLabel('label2', 568, 264, s.assignsText);
        this.buttonHide = this.createButton('button-hide', 88, 211, 110, 50, s.hideText, this.buttonHideClick.bind(this));
        this.buttonShow = this.createButton('button-show', 88, 211, 110, 50, s.showText, this.buttonShowClick.bind(this));
        this.buttonDeal = this.createButton('button-hide', 135, 280, 60, 30, s.newGameText, this.handleDealButtonClick.bind(this));
        this.dirArrow = this.createArrow('dirArrow', 488, 211, 62, 50, '');
        this.swapButton = this.createButton('buttonSwap', 568, 211, 62, 50, s.swapText, this.buttonSwapClick.bind(this));
        this.createHiddenOptionsArea();
        if (this.initData) this.setData(this.initData);
        else {
            this.createPointers(s.numberOfPtrs);
            this.deal(s.n);
        }
        document.addEventListener('keydown', (event) => {
            const e = event;
            let key = event.key.toLowerCase();
            if (event.ctrlKey) key = 'c-' + key;
            if (event.shiftKey) key = 's-' + key;
            if (event.altKey) key = 'a-' + key;
            if (key === ' ') return p(e) + this.buttonSwapClick(this);  // space = vaihda
            if (key === 'a') return p(e) + this.movePtr(0, -1); // a = siirrä vasemmalle punaista
            if (key === 'd') return p(e) + this.movePtr(0, 1); // d = siirrä oikealle punaista
            if (key === 'q') return p(e) + this.movePtr(0, -60); // q = punainen  alkuun
            if (key === 'z') return p(e) + this.movePtr(0, 60); // z = punainen loppuun
            if (key === 's') return p(e) + this.moveToTrash(0); // s = punaisen kohdata roskikseen
            if (key === 'r') return p(e) + this.moveToPtr(0, 1); // r = punainen osoitin mustan luo
            if (key === 'y') return p(e) + this.moveToPtr(2, 1); // y = keltainen osoitin mustan luo
            if (key === 'b') return p(e) + this.moveToPtr(3, 1); // b = sininen osoitin mustan luo
            if (key === 'w') return p(e) + this.moveToPtr(0, 1); // w = punainen osoitin mustan luo
            if (key === 'arrowup') return p(e) + this.moveToPtr(1, 0); // nuoli ylös = musta osoitin punaisen luo
            if (key === 'arrowleft') return p(e) + this.movePtr(1, -1); // nuoli vasemmalle = siirrä vasemmalle mustaa
            if (key === 'arrowright') return p(e) + this.movePtr(1, 1); // nuoli oikealle = siirrä oikealle mustaa
            if (key === 'home') return p(e) + this.movePtr(1, -60); // home = musta alkuun
            if (key === 'end') return p(e) + this.movePtr(1, 60); // end = musta loppuun
            if (key === 'arrowdown') return p(e) + this.moveToTrash(1); // nuoli alas = mustan kohdalta roskikseen
            if (key === 'c-arrowleft') return p(e) + this.movePtr(0, -1) + this.movePtr(1, -1); // ctrl + vasen = siirrä vasemmalle punainen ja musta
            if (key === 'c-arrowright') return p(e) + this.movePtr(0, 1) + this.movePtr(1, 1); // ctrl + oikea = siirrä oikealle punainen ja musta
            if (key === 'c-1') return p(e) + this.movePtrTo(0, 1) + this.movePtrTo(1, 2); // ctrl + 1 = punainen alkuun, musta punaisen oikealle puolen
            if (key === 'c-9') return p(e) + this.movePtrTo(0, 1) + this.movePtrTo(1, -2); // ctrl + 9 = punainen alkuun, musta loppuun
            if (key === 'c-s') return p(e) + this.buttonShowClick(); // ctrl + s = näytä (samalla save)
        });
    }

    p(event) {
        event.preventDefault();
        return 0;
    }

    setTablePositions() {
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

    createTopRowDecks(n, animate = true) {
        const s = this.settings;
        const startx = 8;
        const dw = 73;
        const xsep = 4;
        this.table.removeAllDecks();
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
        if (animate) this.createFirstCard(s.firstCard);

        this.ptrtable.removeAllDecks();
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

        if (s.startOpen) this.show(true, true);

        if (!animate) return;

        setTimeout(() => {
            for (let i = 1; i < this.table.decks.length; i++) {
                const deck = this.table.decks[i];
                if (!s.dealToStorage) deck.animateAddCard(this.dealDeck.pop());
                else {
                    setTimeout(() => {
                        this.storage.animateAddCard(this.dealDeck.pop());
                    }, i*100);
                }
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
        this.firstDeck.removeAllCards();
        const firstCard = this.dealDeck.createNewCard(cardName)
        if (!firstCard) return;
        this.firstDeck.addCard(firstCard);
        firstCard.setBackGroundImageByIndex(this.settings.firstCardBackIndex);
        firstCard.removeAllEventListeners();
    }

    removeFirstCard() {
        if (!this.firstDeck) return;
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
        this.table.removeAllDecks()
        this.ptrtable.removeAllDecks()
        this.dealDeck.shuffle();
        this.dealDeck.sortDeck(this.settings.sortFirst, true);
        this.dealDeck.moveCardsToTop(this.settings.pickCards);
        this.dealDeck.doSwaps(this.settings.swaps);
        this.createTopRowDecks(n);
    }

    deal(n) {
        this.movedWhileNotHidden = false;
        this.buttonHideClick();
        this.setTablePositions();
        if (this.dealDeck.cards.length >= this.dealDeck.maxCards) {
            this.continueDeal(n);
            return;
        }
        this.dealDeck.onFull = (_deck) => this.continueDeal(n);

        this.removeFirstCard(); // remove so that its is not flying to the dealdeck

        this.table.sendCards(this.dealDeck);
        this.recycleBin.sendCards(this.dealDeck);
        this.storage.sendCards(this.dealDeck);
        // this.createTopRowDecks(n);
    }


    initDecks(n) {
        this.setTablePositions();
        this.removeFirstCard(); // remove so that its is not flying to the dealdeck
        this.table.moveCards(this.dealDeck);
        this.recycleBin.moveCards(this.dealDeck);
        this.storage.moveCards(this.dealDeck);
        this.createTopRowDecks(n, false);
    }


    show(visible, forceButtonShow = false) {
        if (visible && !forceButtonShow) {
            document.querySelectorAll('.button-hide').forEach(element => {
               element.style.display = 'block';
            });
            document.querySelector('.button-show').style.display = 'none';
        } else {
            document.querySelectorAll('.button-hide').forEach(element => {
                element.style.display = 'none';
            });
        }
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
        this.ptrtable.removeAllCards();

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
        document.querySelector('.button-show').style.display = 'block';
        this.show(false);
    }

    buttonShowClick() {
        this.show(true);
        if (this.settings.task) saveData(this.getData());
        return 0;
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
        if (i1 === 0 || i2 === 0) return;
        if (i1 >= decks.length || i2 >= decks.length) return;
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

    moveToPtr(ptrIndex, toIndex) {
        const ptrto = this.ptrs[toIndex];
        const deckto = ptrto.deck;
        const ptrmove = this.ptrs[ptrIndex];
        deckto.animateAddCard(ptrmove);
        return 0;
    }

    movePtrTo(ptrIndex, deckIndex) {
        if (deckIndex < 0) deckIndex = this.ptrtable.decks.length + deckIndex;
        const deckto = this.ptrtable.decks[deckIndex];
        const ptrmove = this.ptrs[ptrIndex];
        deckto.animateAddCard(ptrmove);
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
            ptrDeck.setTextTop("80%");
            ptrDeck.setTextLeft("30%");
            ptrDeck.element.style.zIndex = '1';
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
        if (s.movableDirArrow) {
            const x1 = ptrDec1.element.getBoundingClientRect().left;
            const x2 = ptrDec2.element.getBoundingClientRect().left;
            const y1 = 0; // ptrDec1.element.getBoundingClientRect().top;
            const x = (x1 + x2) / 2 + s.dirArrowX;
            const y = y1 + s.dirArrowY;
            this.dirArrow.style.color = 'black';
            this.gameElement.appendChild(this.dirArrow);
            this.dirArrow.style.top = `${y/s.scale}px`;
            this.dirArrow.style.left = `${x/s.scale}px`;
            this.ptrtable.element.appendChild(this.dirArrow);
            this.dirArrow.style.zIndex = '0';
            if (x1 == x2) this.dirArrow.style.display = 'none';
            else this.dirArrow.style.display = 'block';
        }
        if (this.storage.visible) this.movedWhileNotHidden = true;
        if (!this.settingData) updateData(null);
    }

    createHiddenOptionsArea() {
        // Create hidden area container
        const hiddenArea = document.createElement('div');
        hiddenArea.id = 'hidden-area';
        hiddenArea.className = 'hidden-area';
        hiddenArea.style.display = 'none';
        hiddenArea.style.position = 'absolute';
        hiddenArea.style.top = '245px';
        hiddenArea.style.left = '20px';
        hiddenArea.style.backgroundColor = 'white';
        hiddenArea.style.border = '1px solid black';
        hiddenArea.style.padding = '10px';
        hiddenArea.style.zIndex = '1000';
        this.hiddenArea = hiddenArea;

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
        const dealButton = document.createElement('button');
        dealButton.id = 'new-game-button';
        dealButton.textContent = s.newGameText;
        dealButton.onclick = this.handleDealButtonClick.bind(this);
        hiddenArea.appendChild(dealButton);

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
        const hiddenArea = this.hiddenArea;
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

    handleDealButtonClick() {
        const cardCount = this.parseValue(this.cardCountInput, 8, 52);
        const pointerCount = this.parseValue(this.pointerCountInput, 3, 52);
        this.settings.dx = this.parseValue(this.dxInput, 73, 100);
        this.buttonHideClick();
        // this.toggleHiddenArea();
        this.hiddenArea.style.display = 'none';
        this.createPointers(pointerCount);
        this.deal(cardCount);
    }

    setData(data) {
        this.initData = data;
        if (!data || !data.c) return;
        if (areObjectsEqual(data, this.getData())) {
            this.show(true);
            return;
        }
        this.settingData = true;
        const cntrs = data.c.cntrs;
        const ptrs = data.c.ptrs;
        const cards = data.c.cards;
        this.initDecks(cards.length);
        let ptrn = 0;
        let crdn = 0;
        if (ptrs) {
            this.createPointers(ptrs.length);
            for (let i = 0; i < ptrs.length; i++) {
                let ptr = this.ptrs[i];
                let index = ptrs[i];
                if (index < 0) index = 0;
                if (index > this.ptrtable.decks.length - 1) index = this.ptrtable.decks.length - 1;
                this.ptrtable.decks[index].addCard(ptr);
            }
        }

        if (cards) {
            for (let i = 0; i < cards.length; i++) {
                let cardId = cards[i];
                if (cardId) this.table.decks[i + 1].addCard(this.dealDeck.getById(cardId));
            }
        }

        if (data.c.storage)  this.storage.addCardsFromArray(data.c.storage, this.dealDeck);
        if (data.c.trash)  this.recycleBin.addCardsFromArray(data.c.trash, this.dealDeck);

        this.createFirstCard(data.c.c1);

        this.checkValues();
        this.show(true);
        setTimeout(() => {
            this.settingData = false;
            if (cntrs) {
                this.moveCounter.setValue(cntrs[0]);
                this.assignCounter.setValue(cntrs[1]);
            }
        }, 100);
    }


    getCards(deck) {
        const cards = [];
        for (let card of deck.cards) cards.push(card ? card.id : "");
        return cards;
    }


    getData() {
        const ps = [];
        for (let ptr of this.ptrs) ps.push(this.getPtrIndex(ptr));
        const cs = [];
        for (let i = 1; i < this.table.decks.length; i++) {
            const deck = this.table.decks[i];
            const card = deck.peek();
            cs.push(card ? card.id : "");
        }
        const data = { c:
                { cntrs: [this.moveCounter.value,this.assignCounter.value],
                  ptrs: ps,
                  cards: cs,
                  storage: this.getCards(this.storage),
                },
        };
        const firstCard = this.firstDeck ? this.firstDeck.peek() : null;
        if (firstCard) data.c.c1 = firstCard.id;

        const ss = this.storage.getCardsArray()
        if (ss.length > 0) data.c.storage = ss;

        const rs = this.recycleBin.getCardsArray()
        if (rs.length > 0) data.c.trash = rs;

        if (this.movedWhileNotHidden) data.c.moved = true;

        return data;
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

