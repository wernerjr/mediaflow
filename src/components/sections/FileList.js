import Card from '../ui/Card.js';

class FileList {
    constructor(options = {}) {
        this.title = options.title;
        this.actionButton = options.actionButton;
        this.containerId = options.containerId;
        this.listId = options.listId;
        this.countId = options.countId;
    }

    render() {
        const content = `
            <div class="flex flex-col h-full">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-medium text-slate-800">${this.title}</h3>
                    ${this.actionButton}
                </div>

                <!-- Content -->
                <div id="${this.containerId}" class="hidden flex-1 min-h-0">
                    <div class="h-full flex flex-col">
                        <div id="${this.countId}" class="text-sm text-slate-600 mb-4"></div>
                        <div id="${this.listId}" class="flex-1 overflow-y-auto pr-2 space-y-4"></div>
                    </div>
                </div>
            </div>
        `;

        const card = new Card({
            content,
            className: 'h-full'
        });

        return card.render();
    }
}

export default FileList; 