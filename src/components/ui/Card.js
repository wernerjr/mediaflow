class Card {
    constructor(options = {}) {
        this.header = options.header;
        this.content = options.content;
        this.actions = options.actions;
        this.className = options.className || '';
    }

    getBaseClasses() {
        return `bg-white/90 rounded-xl border border-slate-200/50 
            shadow-[0_20px_40px_rgba(0,0,0,0.1)] 
            hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)] 
            transition-all duration-500 hover:scale-[1.01]`;
    }

    renderHeader() {
        if (!this.header) return '';

        return `
            <div class="px-6 py-4 border-b border-slate-200/50 flex justify-between items-center
                bg-gradient-to-r from-slate-50 to-white">
                ${typeof this.header === 'string' 
                    ? `<h3 class="font-medium text-slate-800">${this.header}</h3>`
                    : this.header}
            </div>
        `;
    }

    render() {
        const cardClasses = [
            this.getBaseClasses(),
            this.className,
            'flex flex-col overflow-hidden'
        ].join(' ');

        return `
            <div class="${cardClasses}">
                ${this.renderHeader()}
                <div class="flex-1 min-h-0 p-6">
                    ${this.content || ''}
                </div>
                ${this.actions ? `
                    <div class="px-6 py-4 border-t border-slate-200/50 flex justify-end gap-3">
                        ${this.actions}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

export default Card; 