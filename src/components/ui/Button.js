class Button {
    constructor(options = {}) {
        this.variant = options.variant || 'primary';
        this.disabled = options.disabled || false;
        this.onClick = options.onClick;
        this.icon = options.icon;
        this.text = options.text || '';
        this.fullWidth = options.fullWidth || false;
        this.id = options.id || '';
    }

    getBaseClasses() {
        const classes = {
            primary: `px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl
                hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 text-sm font-medium 
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 
                disabled:opacity-50 disabled:cursor-not-allowed 
                shadow-[0_8px_16px_rgba(59,130,246,0.2)]
                hover:shadow-[0_12px_20px_rgba(59,130,246,0.3)] hover:scale-[1.02] 
                active:scale-[0.98]`,
            secondary: `px-4 py-2 bg-white/90 text-slate-700 rounded-xl 
                hover:bg-white transition-all duration-300 text-sm font-medium 
                focus:outline-none border border-slate-200
                shadow-[0_8px_16px_rgba(255,255,255,0.1)]
                hover:shadow-[0_12px_20px_rgba(255,255,255,0.15)] hover:scale-[1.02]
                focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-[0.98]`,
            success: `px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl
                hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 text-sm font-medium 
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 
                shadow-[0_8px_16px_rgba(16,185,129,0.2)]
                hover:shadow-[0_12px_20px_rgba(16,185,129,0.3)] 
                hover:scale-[1.02] active:scale-[0.98]`,
            action: `px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white 
                rounded-xl border border-blue-400/30 hover:from-blue-600 hover:to-indigo-600
                transition-all duration-300 text-base font-medium tracking-wide
                focus:outline-none shadow-[0_8px_16px_rgba(59,130,246,0.2)]
                hover:shadow-[0_12px_20px_rgba(59,130,246,0.3)]
                hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 
                disabled:cursor-not-allowed disabled:hover:scale-100 
                disabled:hover:shadow-none flex items-center gap-3`
        };

        return classes[this.variant] || classes.primary;
    }

    render() {
        const buttonClasses = [
            this.getBaseClasses(),
            this.fullWidth ? 'w-full' : '',
            'group'
        ].join(' ');

        const content = `
            ${this.icon ? `
                <svg class="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    ${this.icon}
                </svg>
            ` : ''}
            ${this.text ? `
                <span class="group-hover:translate-x-0.5 transition-transform duration-300">
                    ${this.text}
                </span>
            ` : ''}
        `;

        return `
            <button 
                ${this.id ? `id="${this.id}"` : ''}
                class="${buttonClasses}"
                ${this.disabled ? 'disabled="disabled"' : ''}
                ${this.onClick ? `onclick="${this.onClick}"` : ''}>
                ${content}
            </button>
        `;
    }
}

export default Button; 