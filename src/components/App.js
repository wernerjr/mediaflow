import DirectoryInput from './sections/DirectoryInput.js';
import OrganizeControls from './sections/OrganizeControls.js';
import FileList from './sections/FileList.js';
import Button from './ui/Button.js';
import Modal from './ui/Modal.js';

class App {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Inicialização dos componentes
        this.inputDirectory = new DirectoryInput({
            id: 'inputDir',
            label: 'Input Directory',
            onBrowse: 'selectInputDir()'
        });

        this.organizeControls = new OrganizeControls({
            id: 'outputDir',
            onSelectOutput: 'selectOutputDir()',
            onStartOrganizing: 'startOrganizing()'
        });

        // Botões de ação para as listas
        const findDuplicatesButton = new Button({
            id: 'findDuplicatesBtn',
            variant: 'action',
            text: 'Find Duplicates',
            onClick: 'findDuplicates()',
            disabled: true,
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />`
        });

        const findSimilarButton = new Button({
            id: 'findSimilarBtn',
            variant: 'action',
            text: 'Find Similar Images',
            onClick: 'findSimilarImages()',
            disabled: true,
            icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />`
        });

        this.duplicatesList = new FileList({
            title: 'Duplicate Files',
            actionButton: findDuplicatesButton.render(),
            containerId: 'duplicatesContainer',
            listId: 'duplicatesList',
            countId: 'duplicatesCount'
        });

        this.similarList = new FileList({
            title: 'Similar Images',
            actionButton: findSimilarButton.render(),
            containerId: 'similarContainer',
            listId: 'similarList',
            countId: 'similarCount'
        });
    }

    render() {
        return `
            <div class="h-screen flex flex-col">
                <!-- Top Bar -->
                <header class="bg-white/95 border-b border-slate-200 px-6 py-4 shadow-sm">
                    <div class="max-w-7xl mx-auto flex justify-between items-center">
                        <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 
                        bg-clip-text text-transparent tracking-tight">MediaFlow</h1>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="flex-1 overflow-hidden p-6 bg-slate-50">
                    <div class="max-w-7xl mx-auto h-full flex flex-col gap-6">
                        ${this.inputDirectory.render()}
                        ${this.organizeControls.render()}
                        
                        <!-- Results Section -->
                        <div class="grid grid-cols-2 gap-6 flex-1 min-h-0">
                            ${this.duplicatesList.render()}
                            ${this.similarList.render()}
                        </div>
                    </div>
                </main>

                <!-- Modals and Notifications -->
                ${Modal.renderProgress()}
                ${Modal.renderNotifications()}
                ${Modal.renderImagePreview()}
                ${Modal.renderConfirmation()}
            </div>
        `;
    }

    static async init() {
        const app = new App();
        document.getElementById('app').innerHTML = app.render();

        // Carrega o renderer.js e aguarda sua inicialização
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'renderer.js';
            script.onload = resolve;
            document.body.appendChild(script);
        });

        // Aguarda um pequeno intervalo para garantir que o DOM esteja atualizado
        await new Promise(resolve => setTimeout(resolve, 100));

        // Dispara um evento para notificar que a aplicação está pronta
        window.dispatchEvent(new Event('app-ready'));
    }
}

export default App; 