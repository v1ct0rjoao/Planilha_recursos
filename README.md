# 🔋 LabManager - Sistema de Gestão Laboratorial

> **Status:** 🚧 Em Desenvolvimento (Alpha) | **Versão:** 1.0.0
> 
O **LabManager** é uma aplicação Full Stack desenvolvida para automatizar o controle de recursos e testes de baterias no laboratório físico. O objetivo é substituir o preenchimento manual de planilhas Excel por um sistema visual e inteligente com leitura automática (OCR) de telas de equipamentos.

---

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma arquitetura moderna dividida em Frontend (Interface) e Backend (Processamento).

### Frontend (A Interface)
* ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) **React.js:** Biblioteca para criar interfaces interativas e rápidas.
* ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white) **Vite:** Ferramenta de construção (build tool) ultra-rápida.
* ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) **Tailwind CSS:** Framework de estilização para design responsivo e moderno.
* **Lucide React:** Biblioteca de ícones leves e consistentes.

### Backend (O Cérebro)
* ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white) **Python 3:** Linguagem principal para lógica e processamento de dados.
* ![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white) **Flask:** Micro-framework web para criar a API do servidor.
* **Flask-CORS:** Extensão para permitir comunicação segura entre Frontend e Backend.

---

## ⚙️ Pré-requisitos (Instalação)

Antes de rodar o projeto, você precisa ter as seguintes ferramentas instaladas na sua máquina:

1.  **Node.js (LTS):** O "motor" que roda o React. [Baixar aqui](https://nodejs.org/).
2.  **Python (3.x):** Para rodar o servidor backend. [Baixar aqui](https://python.org/).
3.  **Git:** Para baixar e versionar o código. [Baixar aqui](https://git-scm.com/).

---

## 🚀 Como Rodar o Projeto

Siga o passo a passo abaixo para configurar o ambiente de desenvolvimento.

### 1. Clonar o Repositório
Abra o terminal e baixe o código para sua máquina:
git clone https://github.com/v1ct0rjoao/Planilha_recursos.git
cd Planilha_recursos

### 2. Configurar o Frontend (Visual)
Abra um terminal, entre na pasta do frontend e instale as dependências:
cd lab-manager
npm install

Para rodar o site:
npm run dev


### 3. Configurar o Backend (Servidor)
Abra um segundo terminal (mantenha o anterior rodando), volte para a raiz do projeto e configure o Python:
# Se estiver na pasta lab-manager, volte uma pasta:
cd .. 

# Instale as dependências do Python
pip install flask flask-cors

Para rodar o servidor:
python backend/app.py

 
👨‍💻 Desenvolvedor: João Victor
📅 Ano: 2026
🏷️ Versão: 1.0.0 (Alpha)
🏢 Contexto: Laboratório de Testes Físicos
```bash
