class Input {
    constructor(options = {}) {
        this.id = options.id;
        this.type = options.type || 'text';
        this.placeholder = options.placeholder || '';
        this.value = options.value || '';
        this.label = options.label || '';
        this.readonly = options.readonly || false;
        this.className = options.className || '';
        this.onChange = options.onChange;
    }

    getBaseClasses() {
        return `flex-1 rounded-xl border-slate-200 focus:ring-blue-400 
            focus:border-blue-400 bg-white/90 text-slate-900 text-sm 
            shadow-[0_4px_12px_rgba(255,255,255,0.1)]
            hover:border-blue-300 transition-all duration-200`;
    }

    render() {
        const inputClasses = [
            this.getBaseClasses(),
            this.className
        ].join(' ');

        return `
            <div class="space-y-3">
                ${this.label ? `
                    <label for="${this.id}" class="text-sm font-medium text-slate-700">
                        ${this.label}
                    </label>
                ` : ''}
                <input
                    type="${this.type}"
                    id="${this.id}"
                    class="${inputClasses}"
                    placeholder="${this.placeholder}"
                    value="${this.value}"
                    ${this.readonly ? 'readonly' : ''}
                    ${this.onChange ? `onchange="${this.onChange}"` : ''}
                >
            </div>
        `;
    }
}

export default Input; 