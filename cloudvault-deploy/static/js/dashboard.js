// Variáveis globais
let selectedFiles = [];
let currentFileId = null;
let uploadQueue = [];
let currentUploadIndex = 0;
let isUploading = false;

// Funções de mover arquivo
function showMoveModal(fileId, filename) {
    console.log('Função showMoveModal chamada:', { fileId, filename });
    currentFileId = fileId;
    
    // Carregar pastas disponíveis
    fetch('/api/user_folders')
        .then(response => {
            console.log('Resposta da API user_folders:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados das pastas recebidos:', data);
            const select = document.getElementById('destinationFolder');
            select.innerHTML = '<option value="">Pasta raiz</option>';
            
            if (data.folders && data.folders.length > 0) {
                data.folders.forEach(folder => {
                    const option = document.createElement('option');
                    option.value = folder.id;
                    option.textContent = folder.name;
                    select.appendChild(option);
                });
                console.log('Pastas carregadas:', data.folders.length);
            } else {
                console.log('Nenhuma pasta encontrada');
            }
            
            const modal = new bootstrap.Modal(document.getElementById('moveFileModal'));
            modal.show();
        })
        .catch(error => {
            console.error('Erro ao carregar pastas:', error);
            alert('Erro ao carregar pastas disponíveis: ' + error.message);
        });
}

function confirmMoveFile() {
    const folderId = document.getElementById('destinationFolder').value;
    console.log('Confirmando movimento:', { currentFileId, folderId });
    
    fetch(`/api/move_file/${currentFileId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folder_id: folderId })
    })
    .then(response => {
        console.log('Resposta da API move_file:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Dados da resposta move_file:', data);
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('moveFileModal'));
            modal.hide();
            alert('Arquivo movido com sucesso!');
            // Recarregar a página para mostrar as mudanças
            window.location.reload();
        } else {
            alert('Erro ao mover arquivo: ' + (data.error || 'Erro desconhecido'));
        }
    })
    .catch(error => {
        console.error('Erro ao mover arquivo:', error);
        alert('Erro ao mover arquivo: ' + error.message);
    });
}

// Funções de upload em lote com progresso
function startBatchUpload() {
    const fileInput = document.getElementById('multipleFileInput');
    const files = Array.from(fileInput.files);
    
    if (files.length === 0) {
        alert('Selecione arquivos para fazer upload');
        return;
    }
    
    // Preparar fila de upload
    uploadQueue = files;
    currentUploadIndex = 0;
    isUploading = true;
    
    // Mostrar progresso
    showUploadProgress();
    
    // Desabilitar botão
    const uploadBtn = document.getElementById('uploadMultipleBtn');
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
    
    // Iniciar upload
    uploadNextFile();
}

function showUploadProgress() {
    const container = document.getElementById('uploadProgressContainer');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');
    const status = document.getElementById('uploadStatus');
    const count = document.getElementById('uploadCount');
    const total = document.getElementById('uploadTotal');
    const log = document.getElementById('uploadLog');
    
    container.style.display = 'block';
    total.textContent = uploadQueue.length;
    log.innerHTML = '';
    
    updateUploadProgress();
}

function updateUploadProgress() {
    const progress = (currentUploadIndex / uploadQueue.length) * 100;
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');
    const status = document.getElementById('uploadStatus');
    const count = document.getElementById('uploadCount');
    
    progressBar.style.width = progress + '%';
    progressText.textContent = Math.round(progress) + '%';
    count.textContent = currentUploadIndex;
    
    if (currentUploadIndex < uploadQueue.length) {
        const currentFile = uploadQueue[currentUploadIndex];
        status.textContent = `Enviando: ${currentFile.name}`;
    } else {
        status.textContent = 'Concluído!';
    }
}

function addUploadLog(message, type = 'info') {
    const log = document.getElementById('uploadLog');
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `text-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'muted'}`;
    logEntry.innerHTML = `<small>[${timestamp}] ${message}</small>`;
    log.appendChild(logEntry);
    log.scrollTop = log.scrollHeight;
}

function uploadNextFile() {
    if (currentUploadIndex >= uploadQueue.length) {
        // Upload concluído
        finishUpload();
        return;
    }
    
    const file = uploadQueue[currentUploadIndex];
    addUploadLog(`Iniciando upload: ${file.name}`);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Adicionar pasta se estiver em uma
    const folderId = document.querySelector('input[name="folder_id"]').value;
    if (folderId) {
        formData.append('folder_id', folderId);
    }
    
    const xhr = new XMLHttpRequest();
    
    // Configurar progresso
    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            const fileProgress = (e.loaded / e.total) * 100;
            const overallProgress = ((currentUploadIndex + (fileProgress / 100)) / uploadQueue.length) * 100;
            const progressBar = document.getElementById('uploadProgressBar');
            const progressText = document.getElementById('uploadProgressText');
            
            progressBar.style.width = overallProgress + '%';
            progressText.textContent = Math.round(overallProgress) + '%';
        }
    });
    
    // Configurar resposta
    xhr.addEventListener('load', function() {
        if (xhr.status === 200) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    addUploadLog(`✅ ${file.name} enviado com sucesso`, 'success');
                } else {
                    addUploadLog(`❌ ${file.name}: ${response.error || 'Erro desconhecido'}`, 'error');
                }
            } catch (e) {
                addUploadLog(`❌ ${file.name}: Erro ao processar resposta`, 'error');
            }
        } else {
            addUploadLog(`❌ ${file.name}: Erro HTTP ${xhr.status}`, 'error');
        }
        
        currentUploadIndex++;
        updateUploadProgress();
        
        // Continuar com próximo arquivo
        setTimeout(uploadNextFile, 100);
    });
    
    xhr.addEventListener('error', function() {
        addUploadLog(`❌ ${file.name}: Erro de conexão`, 'error');
        currentUploadIndex++;
        updateUploadProgress();
        setTimeout(uploadNextFile, 100);
    });
    
    // Enviar arquivo
    xhr.open('POST', '/api/upload_single');
    xhr.send(formData);
}

function finishUpload() {
    isUploading = false;
    
    // Reabilitar botão
    const uploadBtn = document.getElementById('uploadMultipleBtn');
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Enviar Todos';
    
    // Atualizar status
    const status = document.getElementById('uploadStatus');
    status.textContent = 'Upload concluído!';
    
    addUploadLog('🎉 Upload em lote concluído!', 'success');
    
    // Atualizar storage info
    updateStorageInfo();
    
    // Fechar modal após 2 segundos
    setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadMultipleModal'));
        modal.hide();
        
        // Recarregar página para mostrar novos arquivos
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }, 2000);
}

// Carregar informações de armazenamento
function loadStorageInfo() {
    console.log('Carregando informações de armazenamento...');
    
    const storageElement = document.getElementById('storage-info');
    if (!storageElement) {
        console.error('Elemento storage-info não encontrado no DOM');
        return;
    }
    
    // Mostrar loading
    storageElement.textContent = 'Carregando...';
    
    fetch('/api/storage_info')
        .then(response => {
            console.log('Resposta da API:', response.status, response.statusText);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            const text = `${data.file_count} arquivos • ${data.total_size} usado`;
            storageElement.textContent = text;
            console.log('Informações atualizadas com sucesso:', text);
        })
        .catch(error => {
            console.error('Erro ao carregar informações:', error);
            storageElement.textContent = 'Erro ao carregar';
        });
}

// Função para atualizar storage info após operações
function updateStorageInfo() {
    setTimeout(loadStorageInfo, 1000); // Aguardar 1 segundo para o servidor processar
}

// Gerenciar seleção de arquivos
function updateSelection() {
    const checkboxes = document.querySelectorAll('.file-checkbox:checked');
    selectedFiles = Array.from(checkboxes).map(cb => cb.value);
    
    const deleteBtn = document.getElementById('deleteBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    if (deleteBtn) deleteBtn.disabled = selectedFiles.length === 0;
    if (downloadBtn) downloadBtn.disabled = selectedFiles.length === 0;
}

// Função para lidar com duplo clique
function handleDoubleClick(fileId, isFolder) {
    console.log('Função handleDoubleClick chamada:', { fileId, isFolder });
    
    if (isFolder) {
        console.log('Navegando para pasta:', fileId);
        window.location.href = `/dashboard?folder=${fileId}`;
    } else {
        console.log('Abrindo arquivo:', fileId);
        window.open(`/view/${fileId}`, '_blank');
    }
}

// Excluir arquivo individual (mover para lixeira)
function deleteFile(fileId) {
    if (confirm('Tem certeza que deseja mover este arquivo para a lixeira?')) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/delete/${fileId}`;
        document.body.appendChild(form);
        form.submit();
        
        // Atualizar storage info após exclusão
        updateStorageInfo();
    }
}

// Carregar arquivos recentes
function loadRecentFiles() {
    const container = document.getElementById('recentFilesContainer');
    
    // Mostrar loading
    container.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-2 text-muted">Carregando arquivos recentes...</p>
        </div>
    `;
    
    fetch('/api/recent_files')
        .then(response => response.json())
        .then(data => {
            if (data.files && data.files.length > 0) {
                let html = '<div class="row">';
                data.files.forEach(file => {
                    const fileIcon = file.is_folder ? 'fa-folder text-warning' : 'fa-file text-primary';
                    const fileType = file.is_folder ? 'Pasta' : file.file_type?.toUpperCase() || 'Arquivo';
                    
                    html += `
                        <div class="col-md-6 col-lg-4 mb-3">
                            <div class="card h-100">
                                <div class="card-body">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="fas ${fileIcon} me-2"></i>
                                        <h6 class="card-title mb-0 text-truncate" title="${file.filename}">${file.filename}</h6>
                                    </div>
                                    <p class="card-text small text-muted">
                                        ${file.file_size || '-'} • ${fileType} • ${file.last_accessed}
                                    </p>
                                    <div class="btn-group btn-group-sm w-100">
                                        ${file.is_folder ? 
                                            `<a href="/dashboard?folder=${file.id}" class="btn btn-outline-info" title="Abrir pasta">
                                                <i class="fas fa-folder-open"></i>
                                            </a>` :
                                            `<a href="/view/${file.id}" class="btn btn-outline-primary" title="Visualizar">
                                                <i class="fas fa-eye"></i>
                                            </a>`
                                        }
                                        <a href="/download/${file.id}" class="btn btn-outline-success" title="Download">
                                            <i class="fas fa-download"></i>
                                        </a>
                                        <button class="btn btn-outline-secondary" onclick="showMoveModal(${file.id}, '${file.filename}')" title="Mover">
                                            <i class="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-clock fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">Nenhum arquivo acessado recentemente</h5>
                        <p class="text-muted">Os arquivos que você visualizar aparecerão aqui</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Erro ao carregar arquivos recentes:', error);
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h5 class="text-danger">Erro ao carregar arquivos recentes</h5>
                    <p class="text-muted">Tente novamente mais tarde</p>
                    <button class="btn btn-outline-primary" onclick="loadRecentFiles()">
                        <i class="fas fa-sync-alt me-2"></i>Tentar Novamente
                    </button>
                </div>
            `;
        });
}

// Configurar drag & drop global
function setupGlobalDragAndDrop() {
    const dashboard = document.querySelector('.container-fluid');
    
    // Criar overlay de drag & drop
    const dropOverlay = document.createElement('div');
    dropOverlay.id = 'dropOverlay';
    dropOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 123, 255, 0.1);
        border: 3px dashed #007bff;
        z-index: 9999;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #007bff;
        backdrop-filter: blur(5px);
    `;
    dropOverlay.innerHTML = `
        <div class="text-center">
            <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
            <h3>Solte os arquivos aqui para fazer upload</h3>
            <p>Arraste arquivos ou pastas para esta área</p>
        </div>
    `;
    document.body.appendChild(dropOverlay);
    
    // Eventos de drag & drop
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Verificar se há arquivos sendo arrastados
        if (e.dataTransfer.types.includes('Files')) {
            dropOverlay.style.display = 'flex';
        }
    });
    
    document.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Só esconder se saiu da janela
        if (e.clientX <= 0 || e.clientY <= 0 || 
            e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
            dropOverlay.style.display = 'none';
        }
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        dropOverlay.style.display = 'none';
        
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleDroppedFiles(files);
        }
    });
}

// Processar arquivos soltos
function handleDroppedFiles(files) {
    console.log('Arquivos soltos:', files.length);
    
    // Verificar se há pastas (webkitRelativePath)
    const hasFolders = files.some(file => file.webkitRelativePath && file.webkitRelativePath.includes('/'));
    
    if (hasFolders) {
        // Upload de pasta
        showFolderUploadModal(files);
    } else {
        // Upload de arquivos individuais
        showFileUploadModal(files);
    }
}

// Mostrar modal de upload de arquivos
function showFileUploadModal(files) {
    // Preencher o input de múltiplos arquivos
    const input = document.getElementById('multipleFileInput');
    const dataTransfer = new DataTransfer();
    
    files.forEach(file => {
        dataTransfer.items.add(file);
    });
    
    input.files = dataTransfer.files;
    
    // Disparar evento change
    const event = new Event('change');
    input.dispatchEvent(event);
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('uploadMultipleModal'));
    modal.show();
}

// Mostrar modal de upload de pasta
function showFolderUploadModal(files) {
    // Preencher o input de pasta
    const input = document.getElementById('folderFileInput');
    const dataTransfer = new DataTransfer();
    
    files.forEach(file => {
        dataTransfer.items.add(file);
    });
    
    input.files = dataTransfer.files;
    
    // Disparar evento change
    const event = new Event('change');
    input.dispatchEvent(event);
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('uploadFolderModal'));
    modal.show();
}

// Função para selecionar pasta
function selectFolder() {
    console.log('Função selectFolder chamada');
    const input = document.getElementById('folderFileInput');
    if (input) {
        console.log('Input encontrado, clicando...');
        input.click();
    } else {
        console.error('Input folderFileInput não encontrado');
        alert('Erro: Input de pasta não encontrado');
    }
}

// Inicialização quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard.js carregado');
    
    // Carregar informações de armazenamento
    loadStorageInfo();
    

    
    // Configurar drag & drop global
    setupGlobalDragAndDrop();
    
    // Configurar eventos de seleção
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.file-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
            updateSelection();
        });
    }
    
    // Atualizar seleção quando checkboxes mudarem
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('file-checkbox')) {
            updateSelection();
        }
    });
    
    // Busca de arquivos
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('.file-item');
            
            rows.forEach(row => {
                const fileName = row.querySelector('strong').textContent.toLowerCase();
                if (fileName.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Upload de múltiplos arquivos
    const multipleFileInput = document.getElementById('multipleFileInput');
    if (multipleFileInput) {
        multipleFileInput.addEventListener('change', function() {
            const fileList = document.getElementById('multipleFileList');
            const progressContainer = document.getElementById('uploadProgressContainer');
            
            // Resetar progresso
            progressContainer.style.display = 'none';
            uploadQueue = [];
            currentUploadIndex = 0;
            isUploading = false;
            
            fileList.innerHTML = '';
            
            Array.from(this.files).forEach(file => {
                const div = document.createElement('div');
                div.className = 'alert alert-info d-flex justify-content-between align-items-center';
                div.innerHTML = `
                    <div>
                        <i class="fas fa-file me-2"></i>
                        ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                fileList.appendChild(div);
            });
            
            // Reabilitar botão
            const uploadBtn = document.getElementById('uploadMultipleBtn');
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Enviar Todos';
        });
    }
    
    // Upload de pasta completa
    const folderFileInput = document.getElementById('folderFileInput');
    if (folderFileInput) {
        folderFileInput.addEventListener('change', function() {
            const fileList = document.getElementById('folderFileList');
            fileList.innerHTML = '';
            
            const files = Array.from(this.files);
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            
            // Mostrar resumo da pasta
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'alert alert-warning';
            summaryDiv.innerHTML = `
                <i class="fas fa-folder me-2"></i>
                <strong>Pasta selecionada:</strong> ${files.length} arquivos • ${(totalSize / 1024 / 1024).toFixed(2)} MB
            `;
            fileList.appendChild(summaryDiv);
            
            // Mostrar estrutura de pastas
            const folderStructure = {};
            files.forEach(file => {
                const pathParts = file.webkitRelativePath.split('/');
                const folderName = pathParts[0];
                if (!folderStructure[folderName]) {
                    folderStructure[folderName] = [];
                }
                folderStructure[folderName].push(file);
            });
            
            Object.keys(folderStructure).forEach(folderName => {
                const folderDiv = document.createElement('div');
                folderDiv.className = 'alert alert-light';
                folderDiv.innerHTML = `
                    <i class="fas fa-folder me-2"></i>
                    <strong>${folderName}</strong> (${folderStructure[folderName].length} arquivos)
                `;
                fileList.appendChild(folderDiv);
                
                folderStructure[folderName].forEach(file => {
                    const fileDiv = document.createElement('div');
                    fileDiv.className = 'ms-4 text-muted small';
                    fileDiv.innerHTML = `
                        <i class="fas fa-file me-1"></i>
                        ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)
                    `;
                    fileList.appendChild(fileDiv);
                });
            });
        });
    }
    
    // Configurar drag & drop para áreas de upload
    const uploadAreas = ['uploadArea', 'uploadMultipleArea', 'uploadFolderArea'];
    uploadAreas.forEach(areaId => {
        const area = document.getElementById(areaId);
        if (area) {
            area.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.borderColor = '#6366f1';
                this.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
            });
            
            area.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.style.borderColor = '#e2e8f0';
                this.style.backgroundColor = '';
            });
            
            area.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.borderColor = '#e2e8f0';
                this.style.backgroundColor = '';
                
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    if (areaId === 'uploadMultipleArea') {
                        const input = document.getElementById('multipleFileInput');
                        const dataTransfer = new DataTransfer();
                        files.forEach(file => dataTransfer.items.add(file));
                        input.files = dataTransfer.files;
                        input.dispatchEvent(new Event('change'));
                    } else if (areaId === 'uploadFolderArea') {
                        alert('Para upload de pasta, use o botão "Selecionar Pasta"');
                    } else {
                        const input = document.getElementById('fileInput');
                        const dataTransfer = new DataTransfer();
                        files.forEach(file => dataTransfer.items.add(file));
                        input.files = dataTransfer.files;
                        input.dispatchEvent(new Event('change'));
                    }
                }
            });
        }
    });
    
    // Resetar progresso quando modal de upload múltiplo for fechado
    const uploadModal = document.getElementById('uploadMultipleModal');
    if (uploadModal) {
        uploadModal.addEventListener('hidden.bs.modal', function() {
            const progressContainer = document.getElementById('uploadProgressContainer');
            const uploadBtn = document.getElementById('uploadMultipleBtn');
            
            progressContainer.style.display = 'none';
            uploadQueue = [];
            currentUploadIndex = 0;
            isUploading = false;
            
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<i class="fas fa-upload me-2"></i>Enviar Todos';
        });
    }
    
    // Configurar duplo clique para arquivos e pastas
    const fileRows = document.querySelectorAll('tr.file-item');
    console.log('Linhas encontradas:', fileRows.length);
    
    fileRows.forEach((row, index) => {
        console.log(`Configurando linha ${index}:`, row.dataset);
        
        row.addEventListener('dblclick', function(e) {
            console.log('Duplo clique detectado!');
            
            // Evitar duplo clique em botões
            if (e.target.closest('.btn-group')) {
                console.log('Clicou em botão, ignorando...');
                return;
            }
            
            const fileId = this.dataset.fileId;
            const isFolder = this.dataset.isFolder === 'true';
            
            console.log('Dados do arquivo:', { fileId, isFolder });
            
            handleDoubleClick(fileId, isFolder);
        });
        
        // Adicionar cursor pointer
        row.style.cursor = 'pointer';
    });
    
    // Configurar modal de arquivos recentes
    const recentFilesModal = document.getElementById('recentFilesModal');
    if (recentFilesModal) {
        recentFilesModal.addEventListener('show.bs.modal', function() {
            console.log('Modal de arquivos recentes aberto');
            loadRecentFiles();
        });
    }
    
    console.log('Dashboard inicializado com sucesso!');
});

// Funções do YouTube Downloader
let youtubeDownloadId = null;
let youtubeProgressInterval = null;

function startYouTubeDownload() {
    const url = document.getElementById('youtubeUrl').value.trim();
    const format = document.getElementById('youtubeFormat').value;
    const quality = document.getElementById('youtubeQuality').value;
    const playlist = document.getElementById('youtubePlaylist').checked;
    
    if (!url) {
        alert('Por favor, insira uma URL do YouTube válida');
        return;
    }
    
    // Mostrar área de progresso
    document.getElementById('youtubeProgress').style.display = 'block';
    document.getElementById('youtubeDownloadBtn').disabled = true;
    document.getElementById('youtubeDownloadBtn').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Baixando...';
    
    // Resetar progresso
    document.getElementById('youtubeProgressBar').style.width = '0%';
    document.getElementById('youtubeProgressText').textContent = '0%';
    document.getElementById('youtubePercentage').textContent = '0%';
    document.getElementById('youtubeStatus').textContent = 'Iniciando download...';
    document.getElementById('youtubeTitle').textContent = '';
    
    // Preparar dados do formulário
    const formData = new FormData();
    formData.append('youtube_url', url);
    formData.append('format', format);
    formData.append('quality', quality);
    if (playlist) {
        formData.append('playlist', 'on');
    }
    
    // Fazer requisição AJAX
    fetch('/download_youtube', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            youtubeDownloadId = data.download_id;
            document.getElementById('youtubeTitle').textContent = 'Iniciando download...';
            document.getElementById('youtubeStatus').textContent = 'Preparando download...';
            // Iniciar verificação de progresso
            startProgressCheck();
        } else {
            showYouTubeError(data.error || 'Erro desconhecido');
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showYouTubeError('Erro de conexão: ' + error.message);
    });
}

function startProgressCheck() {
    if (youtubeProgressInterval) {
        clearInterval(youtubeProgressInterval);
    }
    
    youtubeProgressInterval = setInterval(() => {
        if (!youtubeDownloadId) return;
        
        fetch(`/youtube_progress/${youtubeDownloadId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Progresso recebido:', data); // Debug
                updateYouTubeProgress(data);
                
                if (data.status === 'completed' || data.status === 'error') {
                    clearInterval(youtubeProgressInterval);
                    youtubeProgressInterval = null;
                    
                    if (data.status === 'completed') {
                        showYouTubeSuccess(data.message);
                        // Recarregar página após 2 segundos para mostrar o novo arquivo
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else {
                        showYouTubeError(data.message);
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao verificar progresso:', error);
                clearInterval(youtubeProgressInterval);
                youtubeProgressInterval = null;
                showYouTubeError('Erro ao verificar progresso do download');
            });
    }, 500); // Verificar a cada meio segundo para mais responsividade
}

function updateYouTubeProgress(data) {
    const progressBar = document.getElementById('youtubeProgressBar');
    const progressText = document.getElementById('youtubeProgressText');
    const percentage = document.getElementById('youtubePercentage');
    const status = document.getElementById('youtubeStatus');
    const title = document.getElementById('youtubeTitle');
    
    if (data.title) {
        title.textContent = data.title;
    }
    
    if (data.progress !== undefined) {
        const progress = Math.round(data.progress);
        progressBar.style.width = progress + '%';
        progressText.textContent = progress + '%';
        percentage.textContent = progress + '%';
    }
    
    if (data.message) {
        status.textContent = data.message;
    }
}

function showYouTubeSuccess(message) {
    document.getElementById('youtubeDownloadBtn').disabled = false;
    document.getElementById('youtubeDownloadBtn').innerHTML = '<i class="fas fa-check me-2"></i>Concluído!';
    document.getElementById('youtubeStatus').textContent = message;
    document.getElementById('youtubeStatus').className = 'text-success';
    
    // Mostrar alerta de sucesso
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.getElementById('youtubeProgress').appendChild(alertDiv);
}

function showYouTubeError(message) {
    document.getElementById('youtubeDownloadBtn').disabled = false;
    document.getElementById('youtubeDownloadBtn').innerHTML = '<i class="fas fa-download me-2"></i>Baixar Vídeo';
    document.getElementById('youtubeStatus').textContent = message;
    document.getElementById('youtubeStatus').className = 'text-danger';
    
    // Mostrar alerta de erro
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle me-2"></i>${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.getElementById('youtubeProgress').appendChild(alertDiv);
}

// Resetar modal do YouTube quando fechado
document.addEventListener('DOMContentLoaded', function() {
    const youtubeModal = document.getElementById('youtubeModal');
    if (youtubeModal) {
        youtubeModal.addEventListener('hidden.bs.modal', function() {
            // Resetar estado
            document.getElementById('youtubeProgress').style.display = 'none';
            document.getElementById('youtubeInfo').style.display = 'none';
            document.getElementById('youtubeDownloadBtn').disabled = false;
            document.getElementById('youtubeDownloadBtn').innerHTML = '<i class="fas fa-download me-2"></i>Baixar Vídeo';
            document.getElementById('youtubeUrl').value = '';
            
            // Limpar intervalos
            if (youtubeProgressInterval) {
                clearInterval(youtubeProgressInterval);
                youtubeProgressInterval = null;
            }
            youtubeDownloadId = null;
            
            // Limpar alertas
            const alerts = document.querySelectorAll('#youtubeProgress .alert');
            alerts.forEach(alert => alert.remove());
        });
        
        // Buscar informações do vídeo quando URL for inserida
        const youtubeUrlInput = document.getElementById('youtubeUrl');
        if (youtubeUrlInput) {
            let timeoutId;
            youtubeUrlInput.addEventListener('input', function() {
                clearTimeout(timeoutId);
                const url = this.value.trim();
                
                if (url && url.includes('youtube.com')) {
                    timeoutId = setTimeout(() => {
                        fetchYouTubeInfo(url);
                    }, 1000); // Aguardar 1 segundo após parar de digitar
                } else {
                    document.getElementById('youtubeInfo').style.display = 'none';
                }
            });
        }
    }
});

function fetchYouTubeInfo(url) {
    const formData = new FormData();
    formData.append('youtube_url', url);
    
    fetch('/youtube_info', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showYouTubeInfo(data.info);
        } else {
            console.error('Erro ao buscar informações:', data.error);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
    });
}

function showYouTubeInfo(info) {
    document.getElementById('youtubeInfo').style.display = 'block';
    document.getElementById('youtubeVideoTitle').textContent = info.title;
    document.getElementById('youtubeUploader').textContent = info.uploader;
    document.getElementById('youtubeDuration').textContent = formatDuration(info.duration);
    document.getElementById('youtubeViews').textContent = formatNumber(info.view_count);
    document.getElementById('youtubeDate').textContent = formatDate(info.upload_date);
    
    if (info.thumbnail) {
        document.getElementById('youtubeThumbnail').src = info.thumbnail;
    }
    
    // Atualizar checkbox de playlist se for uma playlist
    const playlistCheckbox = document.getElementById('youtubePlaylist');
    if (info.is_playlist) {
        playlistCheckbox.checked = true;
        playlistCheckbox.disabled = false;
    } else {
        playlistCheckbox.checked = false;
        playlistCheckbox.disabled = true;
    }
}

function formatDuration(seconds) {
    if (!seconds) return 'Duração desconhecida';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

function formatNumber(num) {
    if (!num) return '0';
    
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateStr) {
    if (!dateStr) return 'Data desconhecida';
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return `${day}/${month}/${year}`;
} 