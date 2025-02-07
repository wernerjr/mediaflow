import Button from '../ui/Button.js';
import Card from '../ui/Card.js';
import Input from '../ui/Input.js';

class OrganizeControls {
    constructor(options = {}) {
        this.id = options.id;
        this.onSelectOutput = options.onSelectOutput;
        this.onStartOrganizing = options.onStartOrganizing;
    }

    render() {
        const outputInput = new Input({
            id: this.id,
            label: 'Output Directory',
            placeholder: 'Select output directory',
            readonly: true
        });

        const browseButton = new Button({
            variant: 'secondary',
            text: 'Browse',
            onClick: this.onSelectOutput
        });

        const startButton = new Button({
            id: 'startBtn',
            variant: 'action',
            text: 'Start Organizing',
            onClick: this.onStartOrganizing,
            fullWidth: true,
            disabled: true,
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M14 5l7 7m0 0l-7 7m7-7H3" />`
        });

        const content = `
            <h3 class="text-lg font-medium text-slate-800 mb-6">Organize Files</h3>
            
            <!-- Output Directory -->
            <div class="space-y-3 mb-6">
                <div class="flex gap-3">
                    ${outputInput.render()}
                    ${browseButton.render()}
                </div>
            </div>

            <!-- Operation Controls -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-6">
                    <label class="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="operationType" value="copy"
                            class="text-blue-500 focus:ring-blue-400 h-4 w-4
                            border-slate-300">
                        <span class="text-sm text-slate-700">Copy Files</span>
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="operationType" value="move" checked
                            class="text-blue-500 focus:ring-blue-400 h-4 w-4
                            border-slate-300">
                        <span class="text-sm text-slate-700">Move Files</span>
                    </label>
                </div>

                <div class="flex gap-3 min-w-[200px]">
                    ${startButton.render()}
                </div>
            </div>
        `;

        const card = new Card({
            content
        });

        return card.render();
    }
}

export default OrganizeControls; 