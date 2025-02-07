# MediaFlow

Um aplicativo desktop construído com Electron para organizar suas mídias de forma eficiente.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 📋 Descrição

MediaFlow é uma aplicação desktop que ajuda você a organizar suas mídias automaticamente. O aplicativo permite categorizar, renomear e mover arquivos de mídia de forma intuitiva e eficiente.

## ✨ Funcionalidades

- Interface moderna construída com Electron e TailwindCSS
- Organização automática de mídias
- Suporte para diversos formatos de mídia
- Interface de usuário intuitiva e amigável
- Processamento em lote de arquivos

## 🚀 Começando

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório
```bash
git clone https://github.com/wernerjr/mediaflow.git
cd mediaflow
```

2. Instale as dependências
```bash
npm install
# ou
yarn install
```

3. Inicie o aplicativo em modo de desenvolvimento
```bash
npm run start
# ou
yarn start
```

### Construindo o aplicativo

Para criar uma versão distribuível do aplicativo:

```bash
npm run make
# ou
yarn make
```

## 🛠️ Tecnologias Utilizadas

- [Electron](https://www.electronjs.org/) - Framework para criar aplicações desktop
- [React](https://reactjs.org/) - Biblioteca JavaScript para construção de interfaces
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS para estilização
- [Node.js](https://nodejs.org/) - Ambiente de execução JavaScript

## 📁 Estrutura do Projeto

```
mediaflow/
├── src/
│   ├── components/     # Componentes React
│   ├── modules/        # Módulos de lógica de negócio
│   ├── main.js         # Processo principal do Electron
│   └── renderer.js     # Processo de renderização
├── forge.config.js     # Configuração do Electron Forge
└── package.json        # Dependências e scripts
```

## 🤝 Contribuindo

Contribuições são sempre bem-vindas!

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Contato

Werner - werner.junior@outlook.com

Link do Projeto: [https://github.com/wernerjr/mediaflow](https://github.com/wernerjr/mediaflow) 
