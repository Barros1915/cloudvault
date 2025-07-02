# ☁️ CloudVault - Sistema de Armazenamento em Nuvem

Um sistema completo de armazenamento de arquivos em nuvem desenvolvido com Python Flask, oferecendo uma interface moderna e funcionalidades avançadas.

## 🚀 Funcionalidades

### 📁 **Gerenciamento de Arquivos**
- ✅ Upload de arquivos individuais e múltiplos
- ✅ Upload de pastas completas com estrutura
- ✅ Drag & Drop para upload
- ✅ Organização em pastas e subpastas
- ✅ Navegação por breadcrumb
- ✅ Busca de arquivos
- ✅ Visualização de diferentes tipos de arquivo
- ✅ Download de arquivos
- ✅ Exclusão de arquivos

### 🔄 **Upload Avançado**
- ✅ **Upload em Lote com Progresso**: Upload de múltiplos arquivos com barra de progresso detalhada
- ✅ **Drag & Drop Global**: Arraste arquivos de qualquer lugar da tela
- ✅ **Upload de Pasta**: Mantém a estrutura de pastas
- ✅ **Logs Detalhados**: Acompanhe o progresso de cada arquivo

### 📤 **Compartilhamento**
- ✅ Compartilhamento de arquivos com outros usuários
- ✅ Diferentes níveis de permissão (view, edit, admin)
- ✅ Gerenciamento de arquivos compartilhados
- ✅ Visualização de arquivos compartilhados comigo

### 🎯 **Recursos Especiais**
- ✅ **Arquivos Recentes**: Seção dedicada aos arquivos acessados recentemente
- ✅ **Mover Arquivos**: Mova arquivos entre pastas
- ✅ **Informações de Storage**: Contador de arquivos e espaço usado
- ✅ **Conversor de Arquivos**: Converta entre diferentes formatos
- ✅ **Interface Responsiva**: Funciona em desktop e mobile

### 🔐 **Segurança**
- ✅ Sistema de login e registro
- ✅ Autenticação de usuários
- ✅ Controle de permissões
- ✅ Validação de arquivos

## 🛠️ Tecnologias Utilizadas

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework CSS**: Bootstrap 5
- **Ícones**: Font Awesome
- **Banco de Dados**: SQLite
- **Upload**: HTML5 File API

## 📁 Estrutura do Projeto

```
CloudVault/
├── app.py                 # Aplicação principal Flask
├── config.py             # Configurações
├── requirements.txt      # Dependências Python
├── static/              # Arquivos estáticos
│   ├── css/
│   │   ├── cloudvault.css    # CSS principal
│   │   └── dashboard.css     # CSS específico do dashboard
│   ├── js/
│   │   └── dashboard.js      # JavaScript do dashboard
│   └── favicon files...
├── templates/           # Templates HTML
│   ├── base.html       # Template base
│   ├── dashboard.html  # Dashboard principal
│   ├── login.html      # Página de login
│   └── outros templates...
├── uploads/            # Arquivos enviados pelos usuários
└── instance/           # Banco de dados SQLite
```

## 🎨 **Arquitetura Frontend**

### **Separação de Responsabilidades**
- **HTML**: Estrutura e conteúdo
- **CSS**: Estilos e apresentação visual
- **JavaScript**: Interatividade e lógica

### **Arquivos CSS**
- `cloudvault.css`: Estilos globais e componentes reutilizáveis
- `dashboard.css`: Estilos específicos do dashboard

### **Arquivos JavaScript**
- `dashboard.js`: Toda a lógica do dashboard (upload, drag & drop, modais, etc.)

### **Benefícios da Separação**
- ✅ **Performance**: Arquivos podem ser cacheados pelo navegador
- ✅ **Manutenibilidade**: Código organizado e fácil de editar
- ✅ **Reutilização**: CSS/JS podem ser usados em outras páginas
- ✅ **Colaboração**: Múltiplos desenvolvedores podem trabalhar
- ✅ **Debugging**: Mais fácil identificar e corrigir problemas

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Executar a aplicação**:
   ```bash
   python app.py
   ```

3. **Acessar no navegador**:
   ```
   http://localhost:5000
   ```

## 📱 Funcionalidades de Upload

### **Upload Simples**
- Clique no botão "Upload" ou arraste arquivos
- Suporte a múltiplos arquivos
- Limite de 500MB por arquivo

### **Upload em Lote**
- Modal dedicado para múltiplos arquivos
- Barra de progresso detalhada
- Logs em tempo real
- Upload sequencial com tratamento de erros

### **Upload de Pasta**
- Mantém a estrutura de pastas
- Suporte a subpastas
- Visualização da estrutura antes do upload

### **Drag & Drop Global**
- Arraste arquivos de qualquer lugar da tela
- Overlay visual durante o arraste
- Detecção automática de tipo de upload

## 🔧 Configuração

### **Variáveis de Ambiente**
```python
# config.py
SECRET_KEY = 'sua-chave-secreta'
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
```

### **Banco de Dados**
- SQLite automático na primeira execução
- Migrações automáticas para novas funcionalidades

## 📊 Recursos de Performance

- **Cache de Arquivos**: Arquivos CSS/JS são cacheados pelo navegador
- **Upload Otimizado**: Upload sequencial para evitar sobrecarga
- **Interface Responsiva**: Adapta-se a diferentes tamanhos de tela
- **Lazy Loading**: Carregamento sob demanda de componentes

## 🎯 Próximas Funcionalidades

- [ ] Sistema de tags para arquivos
- [ ] Favoritos
- [ ] Compressão automática de imagens
- [ ] Backup automático
- [ ] API REST para integração
- [ ] Notificações em tempo real

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ usando Python Flask e tecnologias modernas de frontend** 