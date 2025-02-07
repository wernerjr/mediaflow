const { ipcRenderer } = require('electron');
const FileOrganizer = require('./modules/fileOrganizer');
const fs = require('fs').promises;

let fileOrganizer = null;
let currentOperation = null;

// Listener para reload da aplicação
ipcRenderer.on('app-reload', () => {
    // Salva o estado atual
    const state = {
        inputDir: document.getElementById('inputDir')?.value,
        outputDir: document.getElementById('outputDir')?.value
    };
    
    // Armazena o estado no localStorage
    localStorage.setItem('appState', JSON.stringify(state));
});

// Aguarda o evento de inicialização da aplicação
window.addEventListener('app-ready', () => {
    // Restaura o estado após o reload
    try {
        const savedState = JSON.parse(localStorage.getItem('appState'));
        if (savedState) {
            const inputDirElement = document.getElementById('inputDir');
            const outputDirElement = document.getElementById('outputDir');
            
            if (savedState.inputDir) {
                inputDirElement.value = savedState.inputDir;
                fileOrganizer = new FileOrganizer(savedState.inputDir, savedState.outputDir);
            }
            
            if (savedState.outputDir) {
                outputDirElement.value = savedState.outputDir;
            }
            
            // Atualiza o estado dos botões
            const findDuplicatesBtn = document.getElementById('findDuplicatesBtn');
            const findSimilarBtn = document.getElementById('findSimilarBtn');
            const startBtn = document.getElementById('startBtn');
            
            if (savedState.inputDir) {
                findDuplicatesBtn.disabled = false;
                findSimilarBtn.disabled = false;
                startBtn.disabled = !savedState.outputDir;
            }
        }
    } catch (error) {
        console.error('Error restoring state:', error);
    }

    // Inicializa os elementos do DOM
    const inputDirElement = document.getElementById('inputDir');
    const outputDirElement = document.getElementById('outputDir');
const findDuplicatesBtn = document.getElementById('findDuplicatesBtn');
const findSimilarBtn = document.getElementById('findSimilarBtn');
const startBtn = document.getElementById('startBtn');
const duplicatesList = document.getElementById('duplicatesList');
const duplicatesContainer = document.getElementById('duplicatesContainer');
const duplicatesCount = document.getElementById('duplicatesCount');
const similarList = document.getElementById('similarList');
const similarContainer = document.getElementById('similarContainer');
const similarCount = document.getElementById('similarCount');

    // Função para mostrar o progresso
function showProgress() {
        const progressOverlay = document.getElementById('progressOverlay');
    progressOverlay.style.display = 'flex';
    progressOverlay.classList.remove('hidden');
    updateProgress(0);
}

    // Função para esconder o progresso
function hideProgress() {
        const progressOverlay = document.getElementById('progressOverlay');
    progressOverlay.style.display = 'none';
    progressOverlay.classList.add('hidden');
    currentOperation = null;
}

    // Função para atualizar o progresso
function updateProgress(progress) {
        const progressText = document.getElementById('progressText');
    progressText.textContent = `${Math.round(progress)}%`;
    }

    // Função para mostrar mensagem de sucesso
    function showSuccess(message) {
        const successMessage = document.getElementById('successMessage');
        const successContainer = document.getElementById('successContainer');
        
        successMessage.textContent = message;
        successContainer.classList.remove('hidden');
        
        setTimeout(() => {
            successContainer.classList.add('hidden');
        }, 3000);
    }

    // Função para mostrar erro
    function showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'fixed bottom-6 right-6 bg-red-50/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-red-100/50 animate-slide-up';
        errorContainer.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0 mr-3">
                    <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p class="text-sm text-red-700">${message}</p>
            </div>
        `;

        document.body.appendChild(errorContainer);
        setTimeout(() => {
            errorContainer.remove();
        }, 5000);
    }

    // Função para selecionar o diretório de entrada
    window.selectInputDir = async () => {
        try {
            const result = await ipcRenderer.invoke('select-directory');
            if (result.success) {
                inputDirElement.value = result.path;
                fileOrganizer = new FileOrganizer(result.path, outputDirElement.value);
                findDuplicatesBtn.disabled = false;
                findSimilarBtn.disabled = false;
                startBtn.disabled = !outputDirElement.value;
        }
    } catch (error) {
            console.error('Error selecting input directory:', error);
            showError('Failed to select input directory. Please try again.');
        }
    };

    // Função para selecionar o diretório de saída
    window.selectOutputDir = async () => {
        try {
            const result = await ipcRenderer.invoke('select-directory');
            if (result.success) {
                outputDirElement.value = result.path;
            if (fileOrganizer) {
                    fileOrganizer.outputDir = result.path;
                }
                startBtn.disabled = !inputDirElement.value;
            }
        } catch (error) {
            console.error('Error selecting output directory:', error);
            showError('Failed to select output directory. Please try again.');
        }
    };

    // Função para mostrar diálogo de confirmação
    function showConfirmDialog(message, isDelete = false) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'fixed inset-0 flex items-center justify-center z-50';
            
            function handleConfirm(confirmed) {
                dialog.remove();
                resolve(confirmed);
            }
            
            dialog.innerHTML = `
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
                <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 relative z-10">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Confirm Action</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end gap-3">
                        <button class="cancel-btn px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium">
                            Cancel
                        </button>
                        <button class="confirm-btn px-4 py-2 ${isDelete ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg transition-colors text-sm font-medium">
                            ${isDelete ? 'Delete' : 'Confirm'}
                        </button>
                    </div>
                </div>
            `;

            // Adiciona event listeners após criar o elemento
            dialog.querySelector('.cancel-btn').addEventListener('click', () => handleConfirm(false));
            dialog.querySelector('.confirm-btn').addEventListener('click', () => handleConfirm(true));
            
            document.body.appendChild(dialog);
        });
    }

    // Função para deletar arquivo
    window.deleteFile = async (filePath) => {
        try {
            const confirmed = await showConfirmDialog('Are you sure you want to delete this file?', true);
            if (!confirmed) return;

            await fs.unlink(filePath);
            
            // Remove o elemento da UI usando o seletor correto
            const fileElement = document.querySelector(`div[data-path="${filePath.replace(/\\/g, '\\\\')}"]`);
            if (fileElement) {
                const groupElement = fileElement.closest('.mb-6');
                if (groupElement) {
                    // Remove o item
                    fileElement.remove();
                    
                    // Verifica quantos itens restam no grupo
                    const remainingFiles = groupElement.querySelectorAll('.aspect-square');
                    const groupHeader = groupElement.querySelector('.mb-2');
                    
                    if (remainingFiles.length <= 1) {
                        // Se sobrou 0 ou 1 item, remove o grupo inteiro
                        groupElement.remove();
                    } else {
                        // Atualiza o contador no cabeçalho do grupo
                        if (groupHeader) {
                            const headerText = groupHeader.querySelector('span');
                            if (headerText) {
                                if (groupElement.closest('#duplicatesContainer')) {
                                    headerText.textContent = `${remainingFiles.length} duplicates`;
                                } else {
                                    headerText.textContent = `${remainingFiles.length} similar images`;
                                }
                            }
                        }
                    }

                    // Atualiza o contador total
                    const duplicatesContainer = document.getElementById('duplicatesContainer');
                    const similarContainer = document.getElementById('similarContainer');
                    
                    if (duplicatesContainer && !duplicatesContainer.classList.contains('hidden')) {
                        const duplicatesCount = document.getElementById('duplicatesCount');
                        const totalGroups = document.querySelectorAll('#duplicatesList > .mb-6').length;
                        if (totalGroups === 0) {
                            duplicatesCount.textContent = 'No duplicates found';
                            duplicatesContainer.classList.add('hidden');
                        }
                    } else if (similarContainer && !similarContainer.classList.contains('hidden')) {
                        const similarCount = document.getElementById('similarCount');
                        const totalGroups = document.querySelectorAll('#similarList > .mb-6').length;
                        if (totalGroups === 0) {
                            similarCount.textContent = 'No similar images found';
                            similarContainer.classList.add('hidden');
                        } else {
                            similarCount.textContent = `Found ${totalGroups} groups of similar images`;
                        }
                    }
                }
            }
            
            showSuccess('File deleted successfully');
        } catch (error) {
            console.error('Error deleting file:', error);
            showError('Failed to delete file. Please try again.');
        }
    };

    // Função para gerar thumbnail de vídeo
    async function generateVideoThumbnail(videoPath) {
        try {
            const result = await ipcRenderer.invoke('generate-video-thumbnail', videoPath);
            if (result.success) {
                return result.thumbnail;
            } else if (result.error && result.error.includes('FFmpeg is not installed')) {
                // Mostra mensagem apenas uma vez
                if (!window.ffmpegMessageShown) {
                    showError('FFmpeg is not installed. Video thumbnails will not be available.');
                    window.ffmpegMessageShown = true;
                }
            }
            return null;
        } catch (error) {
            console.error('Error generating video thumbnail:', error);
            return null;
        }
    }

    // Função para encontrar duplicatas
    window.findDuplicates = async () => {
        if (!fileOrganizer) return;

        try {
            // Limpa ambas as listas e esconde os containers
        duplicatesList.innerHTML = '';
            similarList.innerHTML = '';
        duplicatesContainer.classList.add('hidden');
            similarContainer.classList.add('hidden');
            similarCount.textContent = '';
            
        showProgress();
        currentOperation = 'duplicates';

        const duplicates = await fileOrganizer.findDuplicates((progress) => {
            updateProgress(progress);
        });

        if (duplicates && duplicates.length > 0) {
            let totalSize = 0;
                
                // Adiciona botão global para deletar todas as duplicatas
                const globalDeleteButton = document.createElement('div');
                globalDeleteButton.className = 'flex items-center justify-between mb-6 bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50';
                globalDeleteButton.innerHTML = `
                    <div class="text-sm text-slate-600">
                        <span id="duplicatesCount">Found ${duplicates.length} duplicate groups</span>
                        <span class="text-slate-500">(<span class="text-slate-700" id="totalSize"></span> can be saved)</span>
                    </div>
                    <button onclick="deleteAllDuplicatesGlobal()" 
                        class="px-4 py-2 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm font-medium">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete All Duplicates
                    </button>
                `;
                duplicatesList.appendChild(globalDeleteButton);

                for (const group of duplicates) {
                const groupSize = group.reduce((acc, file) => acc + file.size, 0) - group[0].size;
                totalSize += groupSize;

                    // Atualiza o tamanho total que pode ser economizado
                    const totalSizeElement = document.getElementById('totalSize');
                    if (totalSizeElement) {
                        totalSizeElement.textContent = formatSize(totalSize);
                    }

                const groupElement = document.createElement('div');
                groupElement.className = 'mb-6 last:mb-0';
                    
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'mb-2 flex justify-between items-center';
                    groupHeader.innerHTML = `
                        <span class="text-sm text-gray-600">${group.length} duplicates - ${formatSize(groupSize)}</span>
                        <button onclick="deleteAllDuplicatesInGroup(this)" 
                            class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 text-xs">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete All Duplicates
                                    </button>
                    `;
                    
                    const groupGrid = document.createElement('div');
                    groupGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2';
                    
                    for (const file of group) {
                        const imageElement = document.createElement('div');
                        imageElement.className = 'aspect-square bg-gray-50 rounded overflow-hidden relative group';
                        imageElement.setAttribute('data-path', file.path);
                        
                        // Preserva o caminho original do arquivo
                        const filePath = file.path.replace(/\\/g, '\\\\'); // Escapa as barras invertidas
                        const isImage = /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(file.name);
                        const isVideo = /\.(mp4|webm|mkv|avi|mov)$/i.test(file.name);
                        
                        // Inicialmente mostra o indicador de carregamento para todos os itens
                        imageElement.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        `;

                        // Adiciona o elemento ao grid imediatamente
                        groupGrid.appendChild(imageElement);
                        
                        // Carrega a miniatura de forma assíncrona
                        (async () => {
                            try {
                                if (isImage) {
                                    if (file.name.toLowerCase().endsWith('.heic')) {
                                        // Mostra ícone para arquivos HEIC em vez de converter
                                        imageElement.innerHTML = `
                                            <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
                                                <div class="bg-white/50 backdrop-blur rounded-full p-4 mb-2 shadow-sm">
                                                    <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <span class="text-xs text-slate-600 font-medium text-center px-2 truncate max-w-[90%]">
                                                    ${file.name}
                                                </span>
                                            </div>
                                        `;
                                    } else {
                                        // Para outras imagens, carrega diretamente
                                        imageElement.innerHTML = `
                                            <img src="file:///${file.path.replace(/\\/g, '/')}" 
                                                class="w-full h-full object-cover cursor-pointer"
                                                onclick="previewImage('${filePath}')"
                                                alt="${file.name}"
                                                onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' class=\\'h-6 w-6\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'currentColor\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\\' /></svg>'">
                                        `;
                                    }
                                } else if (isVideo) {
                                    // Placeholder para vídeos com ícone
                                    imageElement.innerHTML = `
                                        <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
                                            <div class="bg-white/50 backdrop-blur rounded-full p-4 mb-2 shadow-sm">
                                                <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <span class="text-xs text-slate-600 font-medium text-center px-2 truncate max-w-[90%]">
                                                ${file.name}
                                            </span>
                                        </div>
                                    `;
                                } else {
                                    // Placeholder para outros tipos de arquivo
                                    imageElement.innerHTML = `
                                        <div class="w-full h-full flex items-center justify-center bg-slate-100">
                                            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span class="text-xs text-slate-500 mt-2 text-center px-2 truncate absolute bottom-2 inset-x-0">
                                                ${file.name}
                                            </span>
                                        </div>
                                    `;
                                }

                                // Adiciona overlay com ações após carregar a miniatura
                                const overlay = document.createElement('div');
                                overlay.className = 'absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';
                                
                                if (isImage) {
                                    overlay.innerHTML = `
                                        <div class="text-center p-2">
                                            <p class="text-xs text-white mb-3 truncate max-w-[150px]">${file.name}</p>
                                            <div class="flex gap-2 justify-center">
                                                <button onclick="previewImage('${filePath}')" 
                                                    class="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>                                            
                                                </button>
                                                <button onclick="deleteFile('${filePath}')" 
                                                    class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>                                            
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                } else {
                                    overlay.innerHTML = `
                                        <div class="text-center p-2">
                                            <p class="text-xs text-white mb-3 truncate max-w-[150px]">${file.name}</p>
                                            <div class="flex justify-center">
                                                <button onclick="deleteFile('${filePath}')" 
                                                    class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1">
                                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>                                            
                                                </button>
                                            </div>
                                        </div>
                                    `;
                                }
                                imageElement.appendChild(overlay);
                            } catch (error) {
                                console.error('Error loading thumbnail:', error);
                                imageElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-red-50">
                                        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                    </div>
                `;
                            }
                        })();
                    }
                    
                    groupElement.appendChild(groupHeader);
                    groupElement.appendChild(groupGrid);
                duplicatesList.appendChild(groupElement);
                }
        } else {
            duplicatesCount.textContent = 'No duplicates found';
        }

        duplicatesContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Error finding duplicates:', error);
            showError('Failed to find duplicates. Please try again.');
    } finally {
        hideProgress();
    }
    };

    // Função para criar URL de imagem
    async function createImageUrl(filePath) {
        try {
            // Se for um arquivo HEIC, converte para JPEG primeiro
            if (filePath.toLowerCase().endsWith('.heic')) {
                const result = await ipcRenderer.invoke('convert-heic', filePath);
                if (result.success) {
                    return `data:image/jpeg;base64,${result.data}`;
                }
                throw new Error('Failed to convert HEIC image');
            }

            const imageBuffer = await fs.readFile(filePath);
            const blob = new Blob([imageBuffer]);
            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Error creating image URL:', error);
            return null;
        }
    }

    // Função para encontrar imagens similares
    window.findSimilarImages = async () => {
        if (!fileOrganizer) return;

        try {
            // Limpa ambas as listas e esconde os containers
        similarList.innerHTML = '';
            duplicatesList.innerHTML = '';
        similarContainer.classList.add('hidden');
            duplicatesContainer.classList.add('hidden');
            duplicatesCount.textContent = '';
            
        showProgress();
        currentOperation = 'similar';

        const similarGroups = await fileOrganizer.findSimilarImages((progress) => {
            updateProgress(progress);
        });

        if (similarGroups && similarGroups.length > 0) {
                for (const group of similarGroups) {
                const groupElement = document.createElement('div');
                groupElement.className = 'mb-6 last:mb-0';
                    
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'mb-2';
                    groupHeader.innerHTML = `
                        <span class="text-sm text-gray-600">${group.length} similar images</span>
                    `;
                    
                    const groupGrid = document.createElement('div');
                    groupGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2';
                    
                    for (const file of group) {
                        const imageElement = document.createElement('div');
                        imageElement.className = 'aspect-square bg-gray-100 rounded overflow-hidden relative group';
                        imageElement.setAttribute('data-path', file.path);
                        
                        // Preserva o caminho original do arquivo
                        const filePath = file.path.replace(/\\/g, '\\\\'); // Escapa as barras invertidas
                        
                        // Verifica se é um arquivo HEIC
                        if (file.path.toLowerCase().endsWith('.heic')) {
                            imageElement.innerHTML = `
                                <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200">
                                    <div class="bg-white/50 backdrop-blur rounded-full p-4 mb-2 shadow-sm">
                                        <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span class="text-xs text-slate-600 font-medium text-center px-2 truncate max-w-[90%]">
                                        ${file.name}
                                    </span>
                                </div>
                            `;
                        } else {
                            imageElement.innerHTML = `
                                <img src="file:///${file.path.replace(/\\/g, '/')}" 
                                    class="w-full h-full object-cover"
                                    alt="${file.name}"
                                    onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' class=\\'h-6 w-6\\' fill=\\'none\\' viewBox=\\'0 0 24 24\\' stroke=\\'currentColor\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\\' /></svg>'">
                            `;
                        }

                        // Adiciona o overlay com as ações
                        const overlay = document.createElement('div');
                        overlay.className = 'absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center';
                        overlay.innerHTML = `
                            <div class="text-center p-2">
                                <p class="text-xs text-white mb-3 truncate max-w-[150px]">${file.name}</p>
                                <div class="flex gap-2 justify-center">
                                    <button onclick="previewImage('${filePath}')" 
                                        class="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>                                            
                                    </button>
                                    <button onclick="deleteFile('${filePath}')" 
                                        class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>                                            
                                    </button>
                    </div>
                    </div>
                `;
                        imageElement.appendChild(overlay);
                        groupGrid.appendChild(imageElement);
                    }
                    
                    groupElement.appendChild(groupHeader);
                    groupElement.appendChild(groupGrid);
                similarList.appendChild(groupElement);
                }

            similarCount.textContent = `Found ${similarGroups.length} groups of similar images`;
        } else {
            similarCount.textContent = 'No similar images found';
        }

        similarContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Error finding similar images:', error);
            showError('Failed to find similar images. Please try again.');
    } finally {
        hideProgress();
    }
    };

    // Função para formatar o tamanho do arquivo
function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

    // Função para iniciar a organização
    window.startOrganizing = async () => {
        if (!fileOrganizer) return;

        try {
            const operationType = document.querySelector('input[name="operationType"]:checked').value;
            const action = operationType === 'move' ? 'move' : 'copy';
            const confirmed = await showConfirmDialog(`Are you sure you want to ${action} all files from the input directory to the output directory? This action will organize your files into folders by date.`, false);
            if (!confirmed) return;

            showProgress();
            currentOperation = 'organize';
            await fileOrganizer.organizeFiles(operationType, (progress) => {
                updateProgress(progress);
            });
            showSuccess('Files organized successfully!');
        } catch (error) {
            console.error('Error organizing files:', error);
            showError('Failed to organize files. Please try again.');
        } finally {
            hideProgress();
        }
    };

    // Função para cancelar a operação atual
    window.cancelProgress = () => {
        if (!currentOperation || !fileOrganizer) return;

        try {
            fileOrganizer.cancel();
            hideProgress();
            showSuccess('Operation canceled');
        } catch (error) {
            console.error('Error canceling operation:', error);
            showError('Failed to cancel operation.');
        }
    };

    // Função para visualizar imagem em tamanho maior
    window.previewImage = async (imagePath) => {
        try {
            const previewModal = document.getElementById('imagePreviewModal');
            const previewImage = document.getElementById('previewImage');
            
            // Decodifica o caminho do arquivo
            const decodedPath = imagePath.replace(/\\\\/g, '\\');
            
            // Mostra o modal com loading
            previewModal.classList.remove('hidden');
            previewModal.style.display = 'block';
            
            // Mostra indicador de loading
            previewImage.classList.add('hidden');
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'previewLoading';
            loadingIndicator.className = 'fixed inset-0 flex items-center justify-center';
            loadingIndicator.innerHTML = `
                <div class="bg-white/20 backdrop-blur-sm rounded-full p-6">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            `;
            previewModal.appendChild(loadingIndicator);

            // Carrega a imagem
            const result = await ipcRenderer.invoke('load-image', decodedPath);
            
            // Remove o loading
            const loadingElement = document.getElementById('previewLoading');
            if (loadingElement) {
                loadingElement.remove();
            }

            if (result.success) {
                if (result.isHeic) {
                    previewImage.src = `data:image/jpeg;base64,${result.base64}`;
                } else {
                    const normalizedPath = decodedPath.replace(/\\/g, '/');
                    previewImage.src = `file:///${normalizedPath}`;
                }
                previewImage.classList.remove('hidden');
            } else {
                throw new Error(result.error);
            }
            
            // Fecha o modal ao clicar fora da imagem
            previewModal.onclick = (event) => {
                if (event.target === previewModal) {
                    closePreview();
                }
            };
        } catch (error) {
            console.error('Error loading preview:', error);
            showError('Failed to load preview');
            closePreview();
        }
    };

    // Função para fechar o modal de preview
    window.closePreview = () => {
        const previewModal = document.getElementById('imagePreviewModal');
        const previewImage = document.getElementById('previewImage');
        
        if (previewImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage.src);
        }
        
        // Esconde o modal e reseta o estilo de display
        previewModal.classList.add('hidden');
        previewModal.style.display = 'none';
        previewImage.classList.add('hidden');
    };

    // Função para deletar todas as duplicatas de um grupo
    window.deleteAllDuplicatesInGroup = async (button) => {
        try {
            const groupElement = button.closest('.mb-6');
            if (!groupElement) return;

            const duplicateElements = Array.from(groupElement.querySelectorAll('.aspect-square')).slice(1);
            const confirmed = await showConfirmDialog(`Are you sure you want to delete ${duplicateElements.length} duplicate files from this group?`, true);
            if (!confirmed) return;

            // Para cada duplicata
            for (const element of duplicateElements) {
                const filePath = element.getAttribute('data-path');
                if (filePath) {
                    try {
                        await fs.unlink(filePath);
                        element.remove();
                    } catch (error) {
                        console.error('Error deleting file:', filePath, error);
                    }
                }
            }

            // Se sobrou apenas o original, remove o grupo
            const remainingFiles = groupElement.querySelectorAll('.aspect-square');
            if (remainingFiles.length <= 1) {
                groupElement.remove();
            } else {
                // Atualiza o contador do grupo
                const headerText = groupElement.querySelector('.text-gray-600');
                if (headerText) {
                    headerText.textContent = `${remainingFiles.length} duplicates`;
                }
            }

            // Atualiza o contador total
            const duplicatesContainer = document.getElementById('duplicatesContainer');
            const duplicatesCount = document.getElementById('duplicatesCount');
            const totalGroups = document.querySelectorAll('#duplicatesList > .mb-6').length;
            
            if (totalGroups === 0) {
                duplicatesCount.textContent = 'No duplicates found';
                duplicatesContainer.classList.add('hidden');
            }

            showSuccess('Duplicates deleted successfully');
    } catch (error) {
        console.error('Error deleting duplicates:', error);
            showError('Failed to delete duplicates. Please try again.');
        }
    };

    // Função para deletar todas as duplicatas de todos os grupos
    window.deleteAllDuplicatesGlobal = async () => {
        try {
            const duplicatesList = document.getElementById('duplicatesList');
            const groups = duplicatesList.querySelectorAll('.mb-6');
            let totalDuplicates = 0;

            // Conta o total de duplicatas
            groups.forEach(group => {
                totalDuplicates += Array.from(group.querySelectorAll('.aspect-square')).slice(1).length;
            });

            const confirmed = await showConfirmDialog(`Are you sure you want to delete all ${totalDuplicates} duplicate files?`, true);
            if (!confirmed) return;

            let deletedCount = 0;

            // Para cada grupo
            for (const group of groups) {
                // Pega todos os elementos de imagem do grupo, exceto o primeiro (que é o original)
                const duplicateElements = Array.from(group.querySelectorAll('.aspect-square')).slice(1);
                
                // Para cada duplicata no grupo
                for (const element of duplicateElements) {
                    const filePath = element.getAttribute('data-path');
                    if (filePath) {
                        try {
                            await fs.unlink(filePath);
                            element.remove();
                            deletedCount++;
                        } catch (error) {
                            console.error('Error deleting file:', filePath, error);
                        }
                    }
                }

                // Se sobrou apenas o original, remove o grupo
                const remainingFiles = group.querySelectorAll('.aspect-square');
                if (remainingFiles.length <= 1) {
                    group.remove();
                }
            }

            // Atualiza o contador total
            const duplicatesContainer = document.getElementById('duplicatesContainer');
            const duplicatesCount = document.getElementById('duplicatesCount');
            const totalGroups = document.querySelectorAll('#duplicatesList > .mb-6').length;
            
            if (totalGroups === 0) {
                duplicatesCount.textContent = 'No duplicates found';
                duplicatesContainer.classList.add('hidden');
            }

            showSuccess(`${deletedCount} duplicate files deleted successfully`);
        } catch (error) {
            console.error('Error deleting all duplicates:', error);
            showError('Failed to delete all duplicates. Please try again.');
        }
    };
}); 