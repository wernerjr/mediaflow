import Button from '../ui/Button.js';
import Card from '../ui/Card.js';
import Input from '../ui/Input.js';

class DirectoryInput {
    constructor(options = {}) {
        this.id = options.id;
        this.label = options.label;
        this.onBrowse = options.onBrowse;
    }

    render() {
        const input = new Input({
            id: this.id,
            label: this.label,
            placeholder: `Select ${this.label.toLowerCase()}`,
            readonly: true
        });

        const browseButton = new Button({
            variant: 'secondary',
            text: 'Browse',
            onClick: this.onBrowse
        });

        const content = `
            <div class="flex gap-3">
                ${input.render()}
                ${browseButton.render()}
            </div>
        `;

        const card = new Card({
            content
        });

        return card.render();
    }
}

export default DirectoryInput; 