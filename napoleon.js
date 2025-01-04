function onInit() {
    new Napoleon(document.getElementById('game'), window.jsframedata);
}


class Napoleon {

    constructor(gameElement, data) {
        this.settings = {
            helpDeckText: 'Apu',       // text for help deck
            handDeckText: 'Käsipakka', // text for hand deck
            sixDeckText: '6-pakka',    // text for for upper 6-deck
            newGameText: 'Uusi peli',  // text for new game link
        }
        if (data) copyParamsValues(data.params, this.settings);
        this.gameElement = gameElement;
        this.createLayout();
    }

    createLayout() {
        let s = this.settings
        this.table = new Table('table', true);
        setElemDimensions(this.table.element, 0, 0, 353, 407);
        this.table.element.style.backgroundColor = '#26bf1e';
        this.gameElement.appendChild(this.table.element);

        const tableAdditionalDecks = new Table('panelAdditionalDecks', true);
        setElemDimensions(tableAdditionalDecks.element, 355, 0, 144, 407);
        tableAdditionalDecks.element.style.backgroundColor = '#26bf1e';
        this.gameElement.appendChild(tableAdditionalDecks.element);

        const deck7Rule = { first: 7, diff: 1, end: 13, nextFirst: 0 };
        const deckMid6Rule = { first: 6, diff: -1, end: 1, nextFirst: 6 };
        const deckHelpRule = { first: ruleAny, diff: 20, end: 0, nextFirst: 0 };
        const deck6Rule = { first: 6, diff: 0, end: 0, nextFirst: 0 };
        const deckHandRule = { first: ruleAny, diff: ruleAny, end: 0, nextFirst: 0 };

        // Create Pakka elements
        const deckInfos = [
            { id: "d7nw", left: 32, top: 32,   caption: '7',   rules: deck7Rule },
            { id: "d7ne", left: 240, top: 32,  caption: '7',   rules: deck7Rule },
            { id: "d7sw", left: 32, top: 264,  caption: '7',   rules: deck7Rule },
            { id: "d7se", left: 240, top: 264, caption: '7',   rules: deck7Rule },
            { id: "d6m", left: 136, top: 148, caption: '6',   rules: deckMid6Rule },
            { id: "dhn", left: 136, top: 32,  caption: s.helpDeckText, rules: deckHelpRule },
            { id: "dhw", left: 32, top: 148,  caption: s.helpDeckText, rules: deckHelpRule },
            { id: "dhs", left: 136, top: 264, caption: s.helpDeckText, rules: deckHelpRule },
            { id: "dhe", left: 240, top: 148, caption: s.helpDeckText, rules: deckHelpRule },
        ];

        // Create additional Decks in tableAdditionalDecks
        const deck6info =  { id: "da6", left: 32, top: 32,  caption: s.sixDeckText, rules: deck6Rule };
        const deckHandInfo = { id: "dah", left: 32, top: 148, caption: s.handDeckText,  rules: deckHandRule };
        const dealDeckInfo = { id: "dad", left: 32, top: 264, caption: ''}

        function setupDeck(deck, deckInfo, table, visible = true) {
            deck.element.style.backgroundColor = '#007f00';
            deck.setVisible(visible);
            table.addDeck(deck);
            deck.setTextSize("11px");
            setPosition(deck, deckInfo.left, deckInfo.top);
        }

        for (let deckInfo of deckInfos) {
            const deck = new RuleDeck(deckInfo.id, deckInfo.caption, deckInfo.rules);
            setupDeck(deck, deckInfo, this.table);
        }

        this.handDeck = new RuleDeck(deckHandInfo.id, deckHandInfo.caption, deckHandInfo.rules);
        setupDeck(this.handDeck, deckHandInfo, tableAdditionalDecks);

        this.deck6 = new RuleDeck(deck6info.id, deck6info.caption, deck6info.rules);
        setupDeck(this.deck6, deck6info, tableAdditionalDecks);

        this.dealDeck = new DealDeck(dealDeckInfo.id);
        setupDeck(this.dealDeck, dealDeckInfo, tableAdditionalDecks, false);
        this.dealDeck.maxCards = 0;  // prevent drag to dealDeck

        this.dealDeck.setVisible(false);
        this.dealDeck.shuffle();

        this.dealDeck.tapHandler = () => this.handDeck.animateAddCard(this.dealDeck.pop());

        const newLink = document.createElement('a');
        newLink.href = '#';
        newLink.textContent = s.newGameText;
        this.table.element.appendChild(newLink);
        setElemDimensions(newLink, 32, -3);
        newLink.onclick = (event) => {
            event.preventDefault();
            this.deal();
        };
    }

    deal() {
        this.dealDeck.onFull = (_deck) => this.dealDeck.shuffle();

        this.table.sendCards(this.dealDeck);
        this.handDeck.sendCards(this.dealDeck);
        this.deck6.sendCards(this.dealDeck);
    }
}