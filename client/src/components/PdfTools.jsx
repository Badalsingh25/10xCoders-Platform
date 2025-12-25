import React, { useState } from "react";
import axios from "axios";
import { PDFDocument } from "pdf-lib";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Upload, Trash2, FileText, Download } from "lucide-react";

GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfTools = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [isMerging, setIsMerging] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imageError, setImageError] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [activeTool, setActiveTool] = useState("merge-pdf");
  const [pdfToJpgFile, setPdfToJpgFile] = useState(null);
  const [pdfToJpgError, setPdfToJpgError] = useState("");
  const [isPdfToJpgConverting, setIsPdfToJpgConverting] = useState(false);
  const [backendFile, setBackendFile] = useState(null);
  const [backendError, setBackendError] = useState("");
  const [isBackendConverting, setIsBackendConverting] = useState(false);

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    const pdfFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf"
    );

    if (!pdfFiles.length) {
      setError("Please select PDF files only.");
      return;
    }

    setError("");
    setFiles((prev) => [...prev, ...pdfFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    const validImages = selectedFiles.filter((file) => file.type.startsWith("image/"));

    if (!validImages.length) {
      setImageError("Please select image files only (JPG or PNG).");
      return;
    }

    setImageError("");
    setImageFiles((prev) => [...prev, ...validImages]);
  };

  const removeImageFile = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mergePdfs = async () => {
    if (!files.length) {
      setError("Add at least two PDF files to merge.");
      return;
    }

    if (files.length < 2) {
      setError("You need a minimum of two PDFs to perform a merge.");
      return;
    }

    setIsMerging(true);
    setError("");

    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices()
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const baseName = files[0].name.replace(/\.[^/.]+$/, "");
      link.download = `${baseName}-merged.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF merge error:", err);
      setError("Failed to merge PDFs. Please try again with valid PDF files.");
    } finally {
      setIsMerging(false);
    }
  };

  const convertImagesToPdf = async () => {
    if (!imageFiles.length) {
      setImageError("Add at least one image to convert.");
      return;
    }

    setIsConverting(true);
    setImageError("");

    try {
      const pdfDoc = await PDFDocument.create();

      for (const file of imageFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let embeddedImage;
        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          embeddedImage = await pdfDoc.embedJpg(bytes);
        } else if (file.type === "image/png") {
          embeddedImage = await pdfDoc.embedPng(bytes);
        } else {
          // Skip unsupported formats to avoid breaking the whole conversion
          continue;
        }

        const { width, height } = embeddedImage;
        const page = pdfDoc.addPage();
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        const margin = 40;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - margin * 2;
        const scale = Math.min(maxWidth / width, maxHeight / height);
        const displayWidth = width * scale;
        const displayHeight = height * scale;
        const x = (pageWidth - displayWidth) / 2;
        const y = (pageHeight - displayHeight) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: displayWidth,
          height: displayHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const baseName = imageFiles[0].name.replace(/\.[^/.]+$/, "");
      link.download = imageFiles.length > 1 ? `${baseName}-merged.pdf` : `${baseName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Image to PDF conversion error:", err);
      setImageError("Failed to convert images. Please try again with valid JPG/PNG files.");
    } finally {
      setIsConverting(false);
    }
  };

  const handlePdfToJpgFileChange = (event) => {
    const file = (event.target.files && event.target.files[0]) || null;
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setPdfToJpgError("Please select a PDF file.");
      setPdfToJpgFile(null);
      return;
    }

    setPdfToJpgError("");
    setPdfToJpgFile(file);
  };

  const convertPdfToJpg = async () => {
    if (!pdfToJpgFile) {
      setPdfToJpgError("Please select a PDF file first.");
      return;
    }

    setIsPdfToJpgConverting(true);
    setPdfToJpgError("");

    try {
      const arrayBuffer = await pdfToJpgFile.arrayBuffer();
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.92)
        );

        if (!blob) continue;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const baseName = pdfToJpgFile.name.replace(/\.pdf$/i, "");
        link.href = url;
        link.download = `${baseName}_page_${pageNum}.jpg`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      await pdf.cleanup?.();
      await loadingTask.destroy?.();
    } catch (err) {
      console.error("PDF to JPG conversion error:", err);
      setPdfToJpgError("Failed to convert PDF. Please try with a smaller or simpler file.");
    } finally {
      setIsPdfToJpgConverting(false);
    }
  };
  const backendTools = [
    "pdf-to-word",
    "word-to-pdf",
    "pdf-to-ppt",
    "ppt-to-pdf",
    "pdf-to-excel",
    "excel-to-pdf",
    "pdf-to-html",
    "eml-to-pdf",
    "split-pdf"
  ];

  const handleBackendFileChange = (event) => {
    const file = (event.target.files && event.target.files[0]) || null;
    if (!file) {
      return;
    }
    setBackendError("");
    setBackendFile(file);
  };

  const convertWithBackend = async () => {
    if (!backendFile) {
      setBackendError("Please select a file first.");
      return;
    }

    if (!backendTools.includes(activeTool)) {
      setBackendError("This conversion type is not supported.");
      return;
    }

    const endpointMap = {
      "pdf-to-word": "/api/convert/pdf-to-word",
      "word-to-pdf": "/api/convert/word-to-pdf",
      "pdf-to-ppt": "/api/convert/pdf-to-ppt",
      "ppt-to-pdf": "/api/convert/ppt-to-pdf",
      "pdf-to-excel": "/api/convert/pdf-to-excel",
      "excel-to-pdf": "/api/convert/excel-to-pdf",
      "pdf-to-html": "/api/convert/pdf-to-html",
      "eml-to-pdf": "/api/convert/eml-to-pdf",
      "split-pdf": "/api/convert/split-pdf",
    };

    const endpoint = endpointMap[activeTool];
    if (!endpoint) {
      setBackendError("Endpoint for this conversion is not configured.");
      return;
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

    const formData = new FormData();
    formData.append("file", backendFile);

    setIsBackendConverting(true);
    setBackendError("");

    try {
      const response = await axios.post(`${backendUrl}${endpoint}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: 'blob', // Important for file download
        validateStatus: (status) => (status >= 200 && status < 300) || status === 501,
      });

      // Check if the response is JSON (error or 501) or Blob (file)
      const contentType = response.headers['content-type'];

      if (response.status === 501) {
        // If 501, it's likely JSON error message, but we requested blob. 
        // We need to read the blob to get the message.
        if (response.data instanceof Blob) {
          const textText = await response.data.text();
          try {
            const json = JSON.parse(textText);
            setBackendError(json.message || "Conversion not implemented.");
          } catch (e) {
            setBackendError("Conversion not implemented.");
          }
        } else {
          setBackendError("Conversion not implemented.");
        }
        return;
      }

      // If success, trigger download
      const contentDisposition = response.headers['content-disposition'];
      let fileName = "converted-file";
      if (contentDisposition) {
        // Try to extract filename="name" or filename=name
        const fileNameMatch = contentDisposition.match(/filename=(?:"([^"]+)"|([^;]+))/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1] || fileNameMatch[2];
        }
      } else {
        // Fallback extension guessing
        const extMap = {
          "pdf-to-word": "docx",
          "word-to-pdf": "pdf",
          "pdf-to-ppt": "pptx",
          "ppt-to-pdf": "pdf",
          "pdf-to-excel": "xlsx",
          "excel-to-pdf": "pdf",
          "pdf-to-html": "html", // or zip if multiple? lets assume html for simple
          "eml-to-pdf": "pdf",
          "split-pdf": "zip"
        };
        fileName = `converted.${extMap[activeTool] || 'file'}`;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setBackendError(""); // Clear any previous errors

    } catch (err) {
      console.error("Backend conversion error:", err);
      // Try to parse error message if it's a blob
      let errorMessage = "Failed to contact the server. Please ensure the backend is running.";
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errorMessage = json.message;
        } catch (e) { }
      }
      setBackendError(errorMessage);
    } finally {
      setIsBackendConverting(false);
    }
  };
  const toolCards = [
    {
      id: "merge-pdf",
      title: "Merge PDF",
      subtitle: "Combine multiple PDFs into one",
      accent: "from-rose-500 to-red-500",
    },
    {
      id: "images-to-pdf",
      title: "Images to PDF",
      subtitle: "Turn JPG/PNG into a single PDF",
      accent: "from-indigo-500 to-violet-500",
    },
    {
      id: "pdf-to-word",
      title: "PDF to Word",
      subtitle: "Convert PDF to DOCX",
      accent: "from-amber-500 to-orange-500",
    },
    {
      id: "word-to-pdf",
      title: "Word to PDF",
      subtitle: "DOCX to printable PDF",
      accent: "from-sky-500 to-cyan-500",
    },
    {
      id: "pdf-to-ppt",
      title: "PDF to PowerPoint",
      subtitle: "Slides from your PDF",
      accent: "from-emerald-500 to-teal-500",
    },
    {
      id: "ppt-to-pdf",
      title: "PowerPoint to PDF",
      subtitle: "Export slides as PDF",
      accent: "from-fuchsia-500 to-pink-500",
    },
    {
      id: "pdf-to-excel",
      title: "PDF to Excel",
      subtitle: "Tables into spreadsheets",
      accent: "from-lime-500 to-emerald-500",
    },
    {
      id: "excel-to-pdf",
      title: "Excel to PDF",
      subtitle: "Spreadsheets to PDF",
      accent: "from-blue-500 to-indigo-500",
    },
    {
      id: "pdf-to-jpg",
      title: "PDF to JPG",
      subtitle: "Export pages as images",
      accent: "from-purple-500 to-violet-500",
    },
    {
      id: "pdf-to-html",
      title: "PDF to HTML",
      subtitle: "Convert PDF to web page",
      accent: "from-orange-500 to-red-500",
    },
    {
      id: "eml-to-pdf",
      title: "EML to PDF",
      subtitle: "Email files to PDF",
      accent: "from-gray-500 to-slate-600",
    },
    {
      id: "split-pdf",
      title: "Split PDF",
      subtitle: "Extract pages from PDF",
      accent: "from-teal-500 to-cyan-600",
    }
  ];


  const activeCard = toolCards.find((tool) => tool.id === activeTool);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 flex items-start justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-6 md:p-10 border border-indigo-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <FileText className="text-indigo-600" size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">PDF Studio</h1>
              <p className="text-sm text-gray-500">
                iLovePDF-style tools for students: merge, convert, and prepare documents safely in your browser.
              </p>
            </div>
          </div>
          <div className="text-xs md:text-sm text-gray-500 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-2">
            100% browser based · Great for resumes, assignments, and notes
          </div>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
          {toolCards.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => {
                setActiveTool(tool.id);
                if (backendTools.includes(tool.id)) {
                  setBackendFile(null);
                  setBackendError("");
                  setIsBackendConverting(false);
                }
              }}
              className={`relative overflow-hidden rounded-2xl border text-left p-3 md:p-4 transition-all duration-200 shadow-sm hover:shadow-lg bg-gradient-to-br ${tool.accent
                } bg-opacity-10 text-white ${activeTool === tool.id
                  ? "ring-2 ring-white/80 scale-[1.02]"
                  : "ring-0 opacity-95 hover:opacity-100"
                }`}
            >
              <div className="absolute inset-0 bg-black/10 mix-blend-soft-light" />
              <div className="relative flex flex-col h-full justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-white/80 mb-1">{tool.id.replace(/-/g, " ")}</p>
                  <h2 className="text-sm md:text-base font-bold leading-snug">{tool.title}</h2>
                  <p className="mt-1 text-[11px] md:text-xs text-white/80">{tool.subtitle}</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] md:text-xs text-white/80">
                  <span>{activeTool === tool.id ? "Selected" : "Tap to use"}</span>
                  <span className="inline-flex items-center gap-1">
                    <span>Open</span>
                    <span className="inline-block w-4 h-[1px] bg-white/70" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Active tool panel */}
        <div className="mt-8">
          {activeTool === "merge-pdf" && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 border border-dashed border-indigo-200 rounded-xl p-4 flex flex-col justify-between bg-indigo-50/60">
                <div>
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    Merge PDF files
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Upload multiple PDFs and combine them into a single document. Files stay on your device.
                  </p>

                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors w-fit">
                    <Upload size={16} />
                    <span>Select PDFs</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {error && (
                    <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      {error}
                    </div>
                  )}

                  <div className="mt-4 max-h-52 overflow-y-auto space-y-2">
                    {files.length === 0 ? (
                      <p className="text-xs text-gray-500">
                        No files added yet. Use the button above to select PDF files.
                      </p>
                    ) : (
                      files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={14} className="text-indigo-500 flex-shrink-0" />
                            <div className="truncate">
                              <p className="font-medium text-gray-800 truncate">
                                {file.name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Remove file"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={mergePdfs}
                    disabled={isMerging || files.length < 2}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isMerging ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Merging...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Merge & Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-600 space-y-3">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">How it works</h2>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Select two or more PDF files from your device.</li>
                  <li>Arrange them in the order you want.</li>
                  <li>Click <span className="font-semibold">Merge & Download</span>.</li>
                </ol>
                <p className="text-[11px] text-gray-500 mt-2">
                  All processing happens locally in your browser using pdf-lib. Ideal for
                  resumes, assignments, and study notes.
                </p>
              </div>
            </div>
          )}

          {activeTool === "images-to-pdf" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="border border-dashed border-indigo-200 rounded-xl p-4 bg-white/70">
                <p className="text-sm font-medium text-gray-800 mb-2">
                  Images to PDF
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Upload JPG or PNG images (notes, diagrams, screenshots) and turn them into a
                  single, shareable PDF.
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors w-fit">
                  <Upload size={16} />
                  <span>Select Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {imageError && (
                  <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {imageError}
                  </div>
                )}

                <div className="mt-4 max-h-52 overflow-y-auto space-y-2">
                  {imageFiles.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No images added yet. Use the button above to select JPG/PNG files.
                    </p>
                  ) : (
                    imageFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-indigo-500 flex-shrink-0" />
                          <div className="truncate">
                            <p className="font-medium text-gray-800 truncate">{file.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImageFile(index)}
                          className="ml-3 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Remove image"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={convertImagesToPdf}
                    disabled={isConverting || imageFiles.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isConverting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Converting...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Convert to PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-600 space-y-3">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">Student-friendly use cases</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Combine handwritten notes into a single PDF before uploading.</li>
                  <li>Turn whiteboard or slide photos into a clean document.</li>
                  <li>Submit assignments that were written on paper as one file.</li>
                </ul>
                <p className="text-[11px] text-gray-500 mt-2">
                  Everything here runs in your browser, so your study material never leaves
                  your device.
                </p>
              </div>
            </div>
          )}

          {activeTool === "pdf-to-jpg" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="border border-dashed border-indigo-200 rounded-xl p-4 bg-white/70">
                <p className="text-sm font-medium text-gray-800 mb-2">
                  PDF to JPG
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Upload a PDF and download each page as a high-quality JPG image.
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors w-fit">
                  <Upload size={16} />
                  <span>Select PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfToJpgFileChange}
                    className="hidden"
                  />
                </label>

                {pdfToJpgError && (
                  <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {pdfToJpgError}
                  </div>
                )}

                {pdfToJpgFile && (
                  <div className="mt-4 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-indigo-500 flex-shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-gray-800 truncate">{pdfToJpgFile.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {(pdfToJpgFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={convertPdfToJpg}
                    disabled={isPdfToJpgConverting || !pdfToJpgFile}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPdfToJpgConverting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Converting...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Download JPG pages</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-600 space-y-3">
                <h2 className="text-sm font-semibold text-gray-800 mb-2">Tips</h2>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use for exporting slides or diagrams as images.</li>
                  <li>Large PDFs may trigger multiple download prompts (one per page).</li>
                  <li>For many pages, consider splitting the PDF first.</li>
                </ul>
              </div>
            </div>
          )}

          {backendTools.includes(activeTool) && (
            <div className="mt-2 border border-dashed border-indigo-200 rounded-2xl bg-indigo-50/40 p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {activeCard?.title}
                </h2>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors w-fit">
                  <Upload size={16} />
                  <span>Select file</span>
                  <input
                    type="file"
                    onChange={handleBackendFileChange}
                    className="hidden"
                  />
                </label>

                {backendError && (
                  <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    {backendError}
                  </div>
                )}

                {backendFile && (
                  <div className="mt-4 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-indigo-500 flex-shrink-0" />
                      <div className="truncate">
                        <p className="font-medium text-gray-800 truncate">{backendFile.name}</p>
                        <p className="text-[11px] text-gray-500">
                          {(backendFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={convertWithBackend}
                    disabled={isBackendConverting || !backendFile}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isBackendConverting ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending to server...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Start conversion</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfTools;
