const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { ipcRenderer } = require('electron');
const crypto = require('crypto');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

class ImageFeatures {
  constructor(path, name, size) {
    this.path = path;
    this.name = name;
    this.size = size;
  }
}

class FileOrganizer {
  constructor(inputDir, outputDir) {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.progress = 0;
    this.totalFiles = 0;
    this.processedFiles = 0;
    this.isPaused = false;
    this.isCanceled = false;
    this.lastProcessedFile = null;
    this.unsupportedFiles = new Set();
    this.batchSize = 10;
    this.duplicates = new Map(); // Map de hash -> array de arquivos duplicados
    this.similarImages = new Map(); // Map para armazenar grupos de imagens semelhantes
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  cancel() {
    this.isCanceled = true;
  }

  reset() {
    this.progress = 0;
    this.totalFiles = 0;
    this.processedFiles = 0;
    this.isPaused = false;
    this.isCanceled = false;
    this.lastProcessedFile = null;
    this.unsupportedFiles.clear();
    this.duplicates.clear();
    this.similarImages.clear();
  }

  isMediaFile(filename) {
    const mediaExtensions = [
      // Imagens
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp', '.heic', '.heif', '.raw', '.cr2', '.nef', '.arw',
      // Vídeos
      '.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mpg', '.mpeg'
    ];
    return mediaExtensions.includes(path.extname(filename).toLowerCase());
  }

  async scanDirectory(inputDir) {
    const allFiles = new Set();
    const mediaFiles = [];
    
    const scan = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext) {
            allFiles.add(ext);
            if (this.isMediaFile(entry.name)) {
              mediaFiles.push(fullPath);
            }
          }
        }
      }
    }
    
    await scan(inputDir);
    this.unsupportedFiles = new Set(
      Array.from(allFiles).filter(ext => !this.isMediaFile(`test${ext}`))
    );
    
    return mediaFiles;
  }

  async getFileDate(filePath) {
    try {
      const metadata = await ipcRenderer.invoke('read-exif', filePath);
      
      if (metadata) {
        const dateFields = ['CreateDate', 'DateTimeOriginal', 'FileModifyDate'];
        
        for (const field of dateFields) {
          const dateValue = metadata[field];
          if (dateValue) {
            const cleanDate = dateValue.toString().split('.')[0].split('+')[0].trim();
            const standardDate = cleanDate.replace(/:/g, '-').replace(/-(\d{2})\s/, '-$1T');
            const date = new Date(standardDate);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
        }
      }
      
      // Se não conseguir extrair a data dos metadados, usa a data de modificação do arquivo
      const stats = await fs.stat(filePath);
      return stats.mtime;
    } catch (error) {
      console.error(`Error reading metadata for ${filePath}:`, error);
      const stats = await fs.stat(filePath);
      return stats.mtime;
    }
  }

  async processFileBatch(files, outputDir, operation) {
    const promises = files.map(async (file) => {
      if (this.isCanceled || this.isPaused) return;

      try {
        const date = await this.getFileDate(file);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        const targetDir = path.join(outputDir, year.toString(), month);
        await fs.mkdir(targetDir, { recursive: true });
        
        const targetPath = path.join(targetDir, path.basename(file));
        
        if (operation === 'move') {
          try {
            await fs.rename(file, targetPath);
          } catch (error) {
            await fs.copyFile(file, targetPath);
            await fs.unlink(file);
          }
        } else {
          await fs.copyFile(file, targetPath);
        }

        this.processedFiles++;
        this.progress = (this.processedFiles / this.totalFiles) * 100;
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    });

    await Promise.all(promises);
  }

  async organizeFiles(operationType = 'copy', progressCallback) {
    try {
      this.reset();
      const files = await this.scanDirectory(this.inputDir);
      
      let startIndex = 0;
      if (this.lastProcessedFile) {
        startIndex = files.findIndex(file => file === this.lastProcessedFile) + 1;
        if (startIndex === 0) {
          this.processedFiles = 0;
        }
      }

      this.totalFiles = files.length;
      
      for (let i = startIndex; i < files.length; i += this.batchSize) {
        if (this.isCanceled) {
          return { completed: false, canceled: true };
        }
        
        if (this.isPaused) {
          this.lastProcessedFile = files[i - 1];
          return { completed: false, canceled: false };
        }

        const batch = files.slice(i, i + this.batchSize);
        await this.processFileBatch(batch, this.outputDir, operationType);
        
        if (progressCallback) {
          progressCallback(this.progress);
        }
      }
      
      this.lastProcessedFile = null;
      return { completed: true, canceled: false };
    } catch (error) {
      console.error('Error organizing files:', error);
      throw error;
    }
  }

  async calculateFileHash(filePath) {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hashSum = crypto.createHash('sha256');
      hashSum.update(fileBuffer);
      return hashSum.digest('hex');
    } catch (error) {
      console.error(`Error calculating hash for ${filePath}:`, error);
      throw error;
    }
  }

  async findDuplicates(progressCallback) {
    this.reset();
    const files = await this.scanDirectory(this.inputDir);
    
    this.totalFiles = files.length;
    this.processedFiles = 0;
    
    const hashMap = new Map();

    for (let i = 0; i < files.length; i += this.batchSize) {
      if (this.isCanceled) break;

      const batch = files.slice(i, Math.min(i + this.batchSize, files.length));
      
      const promises = batch.map(async (file) => {
        try {
          const hash = await this.calculateFileHash(file);
          const fileInfo = {
            path: file,
            name: path.basename(file),
            size: (await fs.stat(file)).size,
            hash
          };

          if (hashMap.has(hash)) {
            hashMap.get(hash).push(fileInfo);
          } else {
            hashMap.set(hash, [fileInfo]);
          }

          this.processedFiles++;
          if (progressCallback) {
            progressCallback((this.processedFiles / this.totalFiles) * 100);
          }
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
        }
      });

      await Promise.all(promises);
    }

    this.duplicates.clear();
    const duplicateGroups = [];
    
    for (const [hash, files] of hashMap.entries()) {
      if (files.length > 1) {
        this.duplicates.set(hash, files);
        duplicateGroups.push(files);
      }
    }

    return duplicateGroups;
  }

  getDuplicates() {
    return this.duplicates;
  }

  async deleteDuplicate(filePath) {
    try {
      await fs.unlink(filePath);
      
      // Atualiza tanto a lista de duplicatas quanto a de similares
      for (const [hash, files] of this.duplicates.entries()) {
        const updatedFiles = files.filter(file => file.path !== filePath);
        if (updatedFiles.length > 1) {
          this.duplicates.set(hash, updatedFiles);
        } else {
          this.duplicates.delete(hash);
        }
      }

      for (const [groupId, files] of this.similarImages.entries()) {
        const updatedFiles = files.filter(file => file.path !== filePath);
        if (updatedFiles.length > 1) {
          this.similarImages.set(groupId, updatedFiles);
        } else {
          this.similarImages.delete(groupId);
        }
      }

      return true;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      throw error;
    }
  }

  async deleteAllDuplicates(progressCallback) {
    try {
      let totalDuplicates = 0;
      let deletedCount = 0;

      // Conta o total de duplicatas (excluindo os originais)
      for (const files of this.duplicates.values()) {
        totalDuplicates += files.length - 1; // -1 para não contar o arquivo original
      }

      // Para cada grupo de duplicatas
      for (const files of this.duplicates.values()) {
        // Começa do índice 1 para preservar o arquivo original
        for (let i = 1; i < files.length; i++) {
          try {
            await fs.unlink(files[i].path);
            deletedCount++;
            
            if (progressCallback) {
              const progress = (deletedCount / totalDuplicates) * 100;
              progressCallback(progress);
            }
          } catch (error) {
            console.error(`Error deleting file ${files[i].path}:`, error);
          }
        }
      }

      // Limpa o mapa de duplicatas
      this.duplicates.clear();
      return deletedCount;
    } catch (error) {
      console.error('Error deleting all duplicates:', error);
      throw error;
    }
  }

  async generateThumbnail(imagePath, size = 256) {
    try {
      const image = sharp(imagePath);
      const metadata = await image.metadata();
      
      // Pula se não for uma imagem suportada
      if (!['jpeg', 'jpg', 'png'].includes(metadata.format?.toLowerCase())) {
        return null;
      }

      const thumbnail = await image
        .resize(size, size, { fit: 'contain', background: '#000000' })
        .grayscale()
        .normalize()
        .modulate({ brightness: 1, saturation: 1.5, hue: 0 })
        .sharpen()
        .raw()
        .toBuffer();

      return thumbnail;
    } catch (error) {
      console.error(`Error generating thumbnail for ${imagePath}:`, error);
      return null;
    }
  }

  calculateImageDifference(buffer1, buffer2) {
    if (!buffer1 || !buffer2 || buffer1.length !== buffer2.length) {
      return 1;
    }

    let diff = 0;
    let totalPixels = buffer1.length;
    let significantDifferences = 0;
    let extremeDifferences = 0;

    // Divide a imagem em regiões 16x16 (mais detalhes)
    const size = Math.sqrt(totalPixels);
    const regionSize = 16;
    const regions = Math.floor(size / regionSize);
    const regionDifferences = new Array(regions * regions).fill(0);

    for (let i = 0; i < buffer1.length; i++) {
      const pixelDiff = Math.abs(buffer1[i] - buffer2[i]);
      diff += pixelDiff;
      
      // Ajusta os limiares de diferença
      if (pixelDiff > 38) { // 15% de diferença (mais sensível)
        significantDifferences++;
        
        // Calcula a região atual
        const x = Math.floor((i % size) / regionSize);
        const y = Math.floor(Math.floor(i / size) / regionSize);
        if (x < regions && y < regions) {
          regionDifferences[y * regions + x]++;
        }
      }
      if (pixelDiff > 77) { // 30% de diferença
        extremeDifferences++;
      }
    }

    // Calcula diferença média
    const avgDiff = diff / (totalPixels * 255);
    
    // Calcula proporção de diferenças significativas e extremas
    const significantRatio = significantDifferences / totalPixels;
    const extremeRatio = extremeDifferences / totalPixels;
    
    // Aumenta o limiar para considerar uma região como diferente
    const regionThreshold = (regionSize * regionSize) * 0.2; // 20% dos pixels da região
    const differentRegions = regionDifferences.filter(d => d > regionThreshold).length;
    const regionRatio = differentRegions / (regions * regions);

    // Nova fórmula com mais peso em diferenças estruturais e extremas
    return (
      avgDiff * 0.2 +           // 20% diferença média
      significantRatio * 0.2 +  // 20% diferenças significativas
      extremeRatio * 0.3 +      // 30% diferenças extremas
      regionRatio * 0.3         // 30% diferenças estruturais
    );
  }

  async generateImageFeatures(imagePath) {
    try {
      const imageResult = await this.loadImage(imagePath);
      if (!imageResult.success) {
        return null;
      }

      const image = sharp(imageResult.data);
      const metadata = await image.metadata();
      
      // Atualiza a lista de formatos suportados para incluir heic
      if (!['jpeg', 'jpg', 'png', 'heic'].includes(metadata.format?.toLowerCase())) {
        return null;
      }

      const features = new ImageFeatures(imagePath, path.basename(imagePath), metadata.size);

      // 1. Average Hash (16x16 para mais precisão)
      const avgHashBuffer = await image
        .resize(16, 16, { fit: 'fill' })
        .grayscale()
        .normalize()
        .raw()
        .toBuffer();

      const avgPixelValue = avgHashBuffer.reduce((sum, val) => sum + val, 0) / avgHashBuffer.length;
      features.averageHash = avgHashBuffer.map(pixel => pixel >= avgPixelValue ? 1 : 0);

      // 2. Perceptual Hash (64x64 para mais detalhes)
      const phashBuffer = await image
        .resize(64, 64, { fit: 'fill' })
        .grayscale()
        .normalize()
        .sharpen()
        .raw()
        .toBuffer();

      features.perceptualHash = phashBuffer;

      // 3. Características de Cor (HSV com mais bins)
      const colorBuffer = await image
        .resize(128, 128, { fit: 'fill' })
        .raw()
        .toBuffer();

      const hsvHistogram = {
        h: new Array(36).fill(0),  // 10° por bin
        s: new Array(20).fill(0),  // 5% por bin
        v: new Array(20).fill(0)   // 5% por bin
      };

      for (let i = 0; i < colorBuffer.length; i += 3) {
        const [h, s, v] = this.rgbToHsv(
          colorBuffer[i],
          colorBuffer[i + 1],
          colorBuffer[i + 2]
        );

        hsvHistogram.h[Math.floor(h * 36)]++;
        hsvHistogram.s[Math.floor(s * 20)]++;
        hsvHistogram.v[Math.floor(v * 20)]++;
      }

      const totalPixels = 128 * 128;
      for (let i = 0; i < 36; i++) {
        if (i < 20) {
          hsvHistogram.s[i] /= totalPixels;
          hsvHistogram.v[i] /= totalPixels;
        }
        hsvHistogram.h[i] /= totalPixels;
      }

      features.colorFeatures = hsvHistogram;

      // 4. Características de Borda e Textura
      const edgeBuffer = await image
        .resize(64, 64, { fit: 'fill' })
        .grayscale()
        .normalize()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })
        .raw()
        .toBuffer();

      // Divide em regiões 8x8 (64 regiões)
      const edgeFeatures = new Array(64).fill(0);
      const regionSize = 8;
      
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const regionX = Math.floor(x / regionSize);
          const regionY = Math.floor(y / regionSize);
          const pixel = edgeBuffer[y * 64 + x];
          edgeFeatures[regionY * 8 + regionX] += pixel;
        }
      }

      const pixelsPerRegion = regionSize * regionSize;
      for (let i = 0; i < edgeFeatures.length; i++) {
        edgeFeatures[i] = edgeFeatures[i] / (pixelsPerRegion * 255);
      }

      features.edgeFeatures = edgeFeatures;

      return features;
    } catch (error) {
      console.error(`Error generating features for ${imagePath}:`, error);
      return null;
    }
  }

  rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    if (diff === 0) {
      h = 0;
    } else if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }

    h = h / 6;
    if (h < 0) h += 1;

    const s = max === 0 ? 0 : diff / max;
    const v = max;

    return [h, s, v];
  }

  calculateImageSimilarity(features1, features2) {
    if (!features1 || !features2) return 1;

    // 1. Hamming distance do Average Hash (15%)
    const hammingDistance = features1.averageHash.reduce(
      (diff, bit, i) => diff + (bit !== features2.averageHash[i] ? 1 : 0),
      0
    ) / features1.averageHash.length;

    // 2. Diferença do Perceptual Hash (35%)
    const phashDiff = this.calculatePerceptualHashDiff(
      features1.perceptualHash,
      features2.perceptualHash
    );

    // 3. Diferença de cor (HSV) (15%)
    const colorDiff = this.calculateColorDifference(
      features1.colorFeatures,
      features2.colorFeatures
    );

    // 4. Diferença de bordas (35%)
    const edgeDiff = this.calculateEdgeDifference(
      features1.edgeFeatures,
      features2.edgeFeatures
    );

    // Combina as métricas com novos pesos
    const similarity = (
      hammingDistance * 0.15 +
      phashDiff * 0.35 +
      colorDiff * 0.15 +
      edgeDiff * 0.35
    );

    // Aplica uma função exponencial para tornar o algoritmo mais rigoroso
    return Math.pow(similarity, 0.7);
  }

  calculatePerceptualHashDiff(phash1, phash2) {
    if (!phash1 || !phash2 || phash1.length !== phash2.length) return 1;

    let diff = 0;
    for (let i = 0; i < phash1.length; i++) {
      diff += Math.abs(phash1[i] - phash2[i]);
    }

    return diff / (phash1.length * 255);
  }

  calculateColorDifference(hist1, hist2) {
    let diff = 0;
    let totalBins = 0;

    // Calcula diferença chi-quadrado para cada canal
    for (const channel of ['h', 's', 'v']) {
      const bins = hist1[channel].length;
      for (let i = 0; i < bins; i++) {
        const h1 = hist1[channel][i];
        const h2 = hist2[channel][i];
        const sum = h1 + h2;
        
        if (sum > 0) {
          diff += Math.pow(h1 - h2, 2) / sum;
        }
      }
      totalBins += bins;
    }

    return Math.min(diff / totalBins, 1);
  }

  calculateEdgeDifference(edges1, edges2) {
    if (!edges1 || !edges2 || edges1.length !== edges2.length) return 1;

    let diff = 0;
    for (let i = 0; i < edges1.length; i++) {
      const d = edges1[i] - edges2[i];
      diff += d * d;
    }

    return Math.min(Math.sqrt(diff) / Math.sqrt(edges1.length), 1);
  }

  async findSimilarImages(progressCallback, similarityThreshold = 0.15) {
    this.reset();
    const files = await this.scanDirectory(this.inputDir);
    
    // Filtra apenas arquivos de imagem
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.heic'].includes(ext);
    });

    // Usa o total de imagens em vez do total de arquivos
    const totalImages = imageFiles.length;
    if (totalImages === 0) return new Map();

    // Atualiza o total de arquivos e zera o contador de processados
    this.totalFiles = totalImages;
    this.processedFiles = 0;

    // Gera características para todas as imagens
    const imageFeatures = new Map();
    this.similarImages.clear();

    // Primeira fase: gerar características (50% do progresso)
    for (let i = 0; i < imageFiles.length; i++) {
      if (this.isCanceled) break;

      const file = imageFiles[i];
      const features = await this.generateImageFeatures(file);
      
      if (features) {
        imageFeatures.set(file, features);
      }

      this.processedFiles = i + 1;
      if (progressCallback) {
        const progress = ((i + 1) / totalImages) * 100;
        progressCallback(progress);
      }
    }

    // Segunda fase: agrupar imagens similares
    const processedImages = new Set();
    let groupId = 0;

    // Calcula o número total de comparações necessárias
    const remainingImages = imageFeatures.size;
    const totalComparisons = (remainingImages * (remainingImages - 1)) / 2;
    let processedComparisons = 0;

    for (const [file1, features1] of imageFeatures) {
      if (this.isCanceled) break;
      if (processedImages.has(file1)) continue;

      const currentGroup = [features1];
      processedImages.add(file1);

      for (const [file2, features2] of imageFeatures) {
        if (file1 === file2 || processedImages.has(file2)) continue;

        const similarity = this.calculateImageSimilarity(features1, features2);
        processedComparisons++;
        
        if (similarity < similarityThreshold) {
          currentGroup.push(features2);
          processedImages.add(file2);
        }
      }

      if (currentGroup.length > 1) {
        this.similarImages.set(groupId++, currentGroup);
      }
    }

    // Converte o Map para array de grupos
    const similarGroups = Array.from(this.similarImages.values());

    // Garante que o progresso chegue a 100% no final
    if (progressCallback) {
      progressCallback(100);
    }

    return similarGroups;
  }

  getSimilarImages() {
    return this.similarImages;
  }

  async deleteSimilarGroup(groupId, progressCallback) {
    try {
      const group = this.similarImages.get(groupId);
      if (!group) return 0;

      let deletedCount = 0;
      const totalToDelete = group.length;

      // Deleta todas as imagens do grupo
      for (let i = 0; i < group.length; i++) {
        try {
          await fs.unlink(group[i].path);
          deletedCount++;
          
          if (progressCallback) {
            const progress = (deletedCount / totalToDelete) * 100;
            progressCallback(progress);
          }
        } catch (error) {
          console.error(`Error deleting file ${group[i].path}:`, error);
        }
      }

      // Remove o grupo do mapa
      this.similarImages.delete(groupId);

      return deletedCount;
    } catch (error) {
      console.error('Error deleting similar group:', error);
      throw error;
    }
  }

  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size
      };
    } catch (error) {
      console.error(`Error getting file info for ${filePath}:`, error);
      throw error;
    }
  }

  async loadImage(filePath) {
    try {
      // Se for um arquivo HEIC, converte para JPEG primeiro
      if (filePath.toLowerCase().endsWith('.heic')) {
        const inputBuffer = await fs.readFile(filePath);
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 1
        });
        return {
          success: true,
          data: outputBuffer,
          isHeic: true,
          base64: outputBuffer.toString('base64')
        };
      }

      // Para outros formatos de imagem
      const imageBuffer = await fs.readFile(filePath);
      return {
        success: true,
        data: imageBuffer,
        isHeic: false
      };
    } catch (error) {
      console.error(`Error loading image ${filePath}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FileOrganizer; 