class Modal {
    static renderProgress() {
        return `
            <div id="progressOverlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden flex items-center justify-center">
                <div class="w-full max-w-sm mx-auto px-4">
                    <div class="bg-white rounded-xl p-6">
                        <div class="text-center">
                            <div class="mb-4">
                                <svg class="w-12 h-12 text-blue-500 mx-auto animate-spin" 
                                    fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" 
                                        stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" 
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                                    </path>
                                </svg>
                            </div>
                            <div class="text-lg font-medium text-slate-900 mb-2">Processing...</div>
                            <div id="progressText" class="text-sm text-slate-500">0%</div>
                        </div>
                        <div class="mt-6">
                            <button onclick="cancelProgress()" 
                                class="w-full px-4 py-2 bg-white text-slate-700 rounded-xl 
                                border border-slate-200 hover:bg-slate-50 transition-colors
                                duration-200 text-sm font-medium">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static renderNotifications() {
        return `
            <div id="successContainer" class="fixed bottom-6 right-6 hidden">
                <div class="bg-emerald-50/90 backdrop-blur-sm p-4 rounded-xl shadow-lg 
                    border border-emerald-100/50">
                    <div class="flex items-start">
                        <div class="flex-shrink-0 mr-3">
                            <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" 
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p id="successMessage" class="text-sm text-emerald-700"></p>
                    </div>
                </div>
            </div>
        `;
    }

    static renderImagePreview() {
        return `
            <div id="imagePreviewModal" class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm hidden 
                z-50 cursor-zoom-out">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="relative">
                        <button onclick="closePreview()" 
                            class="absolute -top-4 -right-4 bg-white rounded-full p-2 shadow-lg
                            hover:bg-slate-50 transition-colors duration-200">
                            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" 
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img id="previewImage" class="max-w-full max-h-[80vh] rounded-lg shadow-2xl" 
                            src="" alt="Preview">
                    </div>
                </div>
            </div>
        `;
    }

    static renderConfirmation() {
        return `
            <div id="confirmationModal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm hidden z-40">
                <div class="flex items-center justify-center min-h-screen p-4">
                    <div class="bg-white rounded-xl p-6 w-full max-w-sm">
                        <div class="text-center mb-6">
                            <div class="w-12 h-12 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                                <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-medium text-slate-900 mb-2">Confirm Delete</h3>
                            <p id="confirmationMessage" class="text-sm text-slate-500"></p>
                        </div>
                        <div class="flex gap-3">
                            <button id="cancelButton"
                                class="flex-1 px-4 py-2 bg-white text-slate-700 rounded-xl 
                                border border-slate-200 hover:bg-slate-50 transition-colors
                                duration-200 text-sm font-medium">
                                Cancel
                            </button>
                            <button id="confirmButton"
                                class="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl 
                                hover:bg-red-600 transition-colors duration-200 text-sm font-medium">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

export default Modal; 