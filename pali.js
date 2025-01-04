function onInit() {
    const container = document.getElementById('container');
    new Pali(container, window.jsframedata);
}

class Pali {
    constructor(container, data) {
        this.settings = {
            inputChars: 10, // input alueen leveys
            minChars: 0, // sanassa tarvittavien merkkien minimimäärä
            labelText: "Anna sana:", // labelin teksti
        }
        if (data) Object.assign(this.settings, data.params);
        this.container = container;
        this.createContent();
    }

    createContent() {
        const s = this.settings;
        const paragraph = document.createElement('p');

        const label = document.createElement('label');
        label.htmlFor = 'word';
        label.textContent = label.textContent = s.labelText.replace('${count}', s.minChars);
        paragraph.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'word';
        input.name = 'word';
        input.style.width = s.inputChars + 'ch';
        paragraph.appendChild(input);

        const icon = document.createElement('span');
        icon.className = 'icon';
        paragraph.appendChild(icon);

        this.container.appendChild(paragraph);
        this.input = input;
        this.icon = icon;

        this.input.addEventListener('input', () => this.checkPalindrome());
    }

    checkPalindrome() {
        const word = this.input.value;
        let isPalindrome = true;
        for (let i = 0, j = word.length - 1; i < j; i++, j--) {
            if (word[i] !== word[j]) {
                isPalindrome = false;
                break;
            }
        }
        if (isPalindrome && this.settings.minChars <= word.length) {
            this.icon.textContent = '✔';
            this.icon.style.color = 'green';
        } else {
            this.icon.textContent = '✘';
            this.icon.style.color = 'red';
        }
    }
}