function onInit() {
    const container = document.getElementById('container');
    window.pali = new Pali(container, window.jsframedata);
}


function setData(data) {
    if (!window.pali) onInit();  // varulta
    window.pali.setData(data);
}


function saveData(data) {
    window.port2.postMessage({ msg: "datasave", data: {  ...data } });
}


function getData() {
    return window.pali.getData();
}


function updateData(data) {
    window.port2.postMessage({ msg: "update", data: {  ...data } });
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

        const label = document.createElement('label');
        label.htmlFor = 'word';
        label.textContent = label.textContent = s.labelText.replace('${count}', s.minChars);
        this.container.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'word';
        input.name = 'word';
        input.style.width = s.inputChars + 'ch';
        this.container.appendChild(input);

        const icon = document.createElement('span');
        icon.className = 'icon';
        this.container.appendChild(icon);

        this.input = input;
        this.icon = icon;

        this.input.addEventListener('input', () => this.checkPalindrome());
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                saveData(this.getData());
            }
        });
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
        updateData(getData());
    }

    getData() {
        return { c: { text: this.input.value } };
    }

    setData(data) {
        const newText = data.c.text;
        if (this.input.value === newText) return;
        this.input.value = newText;
        this.checkPalindrome();
    }
}