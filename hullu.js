function setData(data) {
    if (!window.hullu)
        window.hullu = new Hullu(document.getElementById('game'), window.jsframedata);
    console.log('setData', data);
    window.hullu.setData(data);
}


function onInit() {
    if (window.hullu || !window.jsframedata ) return;
    window.hullu = new Hullu(document.getElementById('game'), window.jsframedata);
}


function saveData(data) {
  window.port2.postMessage({ msg: "datasave", data: {  ...data } });
}


function getData() {
    return  { c: { text: `${window.hullu.counterLeft.value};${window.hullu.counter.value}` } };
}


function updateData(data) {
      window.port2.postMessage({ msg: "update", data: {  ...data } });
}


hulluTranslations = {
    en: {
        winningText: "- Ohoh! You won! -",   // text for winning
        loosingText: "- Äh! You loose! -",   // text for loosing
        newGameText: "New game",             // text for new game link
        handDeckText: "Hand deck",           // text for hand deck
    }
}


class Hullu {
    constructor(gameElement, data) {
        this.settings = {
            lang: "fi",                          // laguage, fi, en
            winningText: "- Ohoh! Voitit! -",    // text for winning
            loosingText: "- Hähää! Hävisit! -",  // text for loosing
            newGameText: "Uusi peli",            // text for new game link
            handDeckText: "Käsipakka",           // text for hand deck
            showCardsLeft: false, // if false, show the round number 1-4.
                                  // if true, show the number of cards left in the deal deck
        };
        if (data) {
            const lang = data.params?.lang ?? 'fi';
            Object.assign(this.settings, hulluTranslations[lang] ?? {}, );
            copyParamsValues(data.params, this.settings);
        }
        this.gameElement = gameElement;
        this.createLayout();
    }

    createLayout() {
        this.table = new Table('table', true);
        setElemDimensions(this.table.element, 0, 0, 250, 200);
        this.table.element.style.backgroundColor = '#26bf1e';
        this.gameElement.appendChild(this.table.element);

        const dealDeckInfo = { id: "dad", left: 32, top: -30, caption: '' }
        const deckHandInfo = { id: "dah", left: 140, top: -30, caption: this.settings.handDeckText, rules: { first: ruleAny, diff: ruleAny, end: 0, nextFirst: 0 } };

        function setupDeck(deck, deckInfo, table, visible = true) {
            deck.element.style.backgroundColor = '#007f00';
            deck.setVisible(visible);
            table.addDeck(deck);
            deck.setTextSize("11px");
            setPosition(deck, deckInfo.left, deckInfo.top);
        }

        this.handDeck = new PlayingCardDeck(deckHandInfo.id, deckHandInfo.caption, deckHandInfo.rules);
        setupDeck(this.handDeck, deckHandInfo, this.table);
        this.handDeck.maxCards = 0;  // ei saa pudottaa
        this.handDeck.setVisible(true);

        this.dealDeck = new DealDeck(dealDeckInfo.id);
        setupDeck(this.dealDeck, dealDeckInfo, this.table, false);
        this.dealDeck.setVisible(false);
        this.dealDeck.shuffle();

        const newLink = document.createElement('a');
        newLink.href = '#';
        newLink.textContent = this.settings.newGameText;
        this.table.element.appendChild(newLink);
        setElemDimensions(newLink, 32, -3);
        newLink.onclick = (event) => {
            event.preventDefault();
            this.deal();
        };

        const label = document.createElement('div');
        this.table.element.appendChild(label);
        setElemPosition(label, 32, 0);
        label.style.color = 'yellow';
        label.style.fontSize = '25px';
        label.style.fontWeight = 'bold';
        label.textContent = "";
        label.style.backgroundColor = 'red';
        this.labelResult = label;

        this.counterLeft = this.createCounter('r', 40, 32, 1);
        this.counter = this.createCounter('n', 145, 32, 0);
        this.checkCounterLeft()

        const labelLast = document.createElement('div');
        labelLast.style.color = "black";
        this.labelLast = setElemPosition(labelLast, 145, -3);
        this.table.element.appendChild(labelLast);

        this.dealDeck.tapHandler = (_deck, _card) => {
            if (this.labelResult.textContent !== "") return;
            const card = this.dealDeck.pop();
            this.counter.inc();
            if (this.counter.value === 14) {
                this.counter.setValue(1);
                this.counterLeft.inc();
            }
            this.checkCounterLeft();
            let doSave = false;
            if (this.counter.value === card.value) {
                this.labelResult.textContent = this.settings.loosingText;
                doSave = true;
            }
            if (this.dealDeck.cards.length === 0) {
                this.labelResult.textContent = this.settings.winningText;
                doSave = true;
            }
            if (doSave) {
                saveData({c:  { text: `${this.counterLeft.value};${this.counter.value}` }});
                this.labelLast.textContent = `${this.counterLeft.value} / ${this.counter.value}`;
            }
            this.handDeck.animateAddCard(card)
        }
    }

    createCounter(id, left, top, value) {
        const counter = new Counter(id)
        this.table.element.appendChild(counter.element);
        counter.setValue(value);
        return setPosition(counter, left, top);
    }

    deal() {
        this.dealDeck.onFull = (_deck) => {
            this.counter.setValue(0);
            this.counterLeft.setValue(1);
            this.checkCounterLeft()
            this.dealDeck.shuffle();
        }
        this.labelResult.textContent = "";
        this.handDeck.sendCards(this.dealDeck);
        updateData({c:  { text: `${this.counterLeft.value};${this.counter.value}` }});
    }

    setData(data) {
        if (data.code) {
            this.labelLast.textContent = `${data.code}`;
        }
        if (data.c) {
            const [left, value] = data.c.text.split(';');
            this.labelLast.textContent = `${left} / ${value}`;
        }
    }


    checkCounterLeft() {
        if (this.settings.showCardsLeft) this.counterLeft.setValue(this.dealDeck.cards.length);
    }
}
