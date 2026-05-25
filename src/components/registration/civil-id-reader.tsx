"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Camera, X, CheckCircle2, AlertCircle } from "lucide-react";

interface CivilIdData {
  civilIdNumber: string;
  civilIdName: string;
  civilIdNationality: string;
  civilIdDob: string;
}

interface CivilIdReaderProps {
  onDataExtracted: (data: CivilIdData) => void;
  lang?: "en" | "ar";
}

/** Parse OCR text from a Kuwait Civil ID card */
function parseCivilIdText(text: string): CivilIdData {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join(" ");

  let civilIdNumber = "";
  let civilIdName = "";
  let civilIdNationality = "";
  let civilIdDob = "";

  // Extract Civil ID Number (12 digits)
  const idMatch = fullText.match(/\b(\d{12})\b/);
  if (idMatch) {
    civilIdNumber = idMatch[1];
  } else {
    // Try to find a long number sequence (might have spaces/dashes)
    const looseId = fullText.replace(/[^0-9]/g, "");
    if (looseId.length >= 12) {
      civilIdNumber = looseId.substring(0, 12);
    }
  }

  // Extract date of birth (DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY)
  const dateMatch = fullText.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const year = dateMatch[3];
    civilIdDob = `${year}-${month}-${day}`;
  }

  // Extract nationality — common Kuwait Civil ID nationalities
  const nationalityPatterns = [
    { pattern: /kuwaiti|كويتي/i, value: "Kuwaiti" },
    { pattern: /egyptian|مصري/i, value: "Egyptian" },
    { pattern: /indian|هندي/i, value: "Indian" },
    { pattern: /pakistani|باكستاني/i, value: "Pakistani" },
    { pattern: /bangladeshi|بنغلاديشي/i, value: "Bangladeshi" },
    { pattern: /syrian|سوري/i, value: "Syrian" },
    { pattern: /lebanese|لبناني/i, value: "Lebanese" },
    { pattern: /jordanian|أردني/i, value: "Jordanian" },
    { pattern: /iraqi|عراقي/i, value: "Iraqi" },
    { pattern: /filipino|فلبيني/i, value: "Filipino" },
    { pattern: /sri.?lankan|سريلانكي/i, value: "Sri Lankan" },
    { pattern: /saudi|سعودي/i, value: "Saudi" },
    { pattern: /yemeni|يمني/i, value: "Yemeni" },
    { pattern: /iranian|إيراني/i, value: "Iranian" },
    { pattern: /american|أمريكي/i, value: "American" },
    { pattern: /british|بريطاني/i, value: "British" },
  ];

  for (const { pattern, value } of nationalityPatterns) {
    if (pattern.test(fullText)) {
      civilIdNationality = value;
      break;
    }
  }

  // Extract name — look for English name patterns (First Last or multi-word)
  // Civil IDs often have "Name:" or the name after certain keywords
  const namePatterns = [
    /name[:\s]+([A-Za-z\s]+?)(?:\n|$|date|birth|national|civil|sex|gender)/i,
    /holder[:\s]+([A-Za-z\s]+?)(?:\n|$|date|birth)/i,
  ];

  for (const pattern of namePatterns) {
    const nameMatch = fullText.match(pattern);
    if (nameMatch && nameMatch[1].trim().length > 2) {
      civilIdName = nameMatch[1].trim().replace(/\s+/g, " ");
      break;
    }
  }

  // Fallback: find lines that look like names (2+ words, all letters)
  if (!civilIdName) {
    for (const line of lines) {
      const cleaned = line.replace(/[^A-Za-z\s؀-ۿ]/g, "").trim();
      const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
      if (words.length >= 2 && words.length <= 5 && cleaned.length > 4) {
        // Skip common non-name lines
        const skipWords = ["civil", "state", "kuwait", "card", "identity", "public", "authority", "affairs"];
        const isSkip = skipWords.some((sw) => cleaned.toLowerCase().includes(sw));
        if (!isSkip) {
          civilIdName = words.join(" ");
          break;
        }
      }
    }
  }

  return { civilIdNumber, civilIdName, civilIdNationality, civilIdDob };
}

export function CivilIdReader({ onDataExtracted, lang = "en" }: CivilIdReaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CivilIdData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isAr = lang === "ar";

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setError(isAr ? "يرجى اختيار صورة" : "Please select an image file");
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng+ara", undefined, {
        logger: (m: { progress: number }) => {
          setProgress(Math.round(m.progress * 100));
        },
      });

      const { data } = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseCivilIdText(data.text);
      setResult(parsed);

      // Only send data that was actually extracted
      const hasData = parsed.civilIdNumber || parsed.civilIdName || parsed.civilIdDob || parsed.civilIdNationality;
      if (hasData) {
        onDataExtracted(parsed);
      } else {
        setError(isAr ? "لم نتمكن من قراءة البيانات. يرجى إدخالها يدوياً" : "Could not read data from image. Please enter manually.");
      }
    } catch (err) {
      console.error("OCR error:", err);
      setError(isAr ? "حدث خطأ في قراءة الصورة" : "Error reading image. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function clearImage() {
    setImage(null);
    setResult(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Camera className="h-4 w-4" />
        {isAr ? "قراءة البطاقة المدنية" : "Civil ID Scanner"}
      </h3>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        {isAr
          ? "ارفع صورة البطاقة المدنية وسيتم تعبئة البيانات تلقائياً"
          : "Upload a photo of the Civil ID and data will be filled automatically"}
      </p>

      {!image ? (
        <div className="space-y-3">
          {/* Two buttons: Upload from gallery OR Take photo */}
          <div className="grid grid-cols-2 gap-3">
            {/* Upload from photos/gallery */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all hover:border-white/30"
              style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)" }}
            >
              <Upload className="h-6 w-6" style={{ color: "rgba(255,255,255,0.4)" }} />
              <span className="text-xs font-medium text-white">
                {isAr ? "اختر من الصور" : "Choose from Photos"}
              </span>
            </button>

            {/* Take new photo with camera */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-all hover:border-white/30"
              style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)" }}
            >
              <Camera className="h-6 w-6" style={{ color: "rgba(255,255,255,0.4)" }} />
              <span className="text-xs font-medium text-white">
                {isAr ? "التقط صورة" : "Take Photo"}
              </span>
            </button>
          </div>

          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            {isAr ? "PNG, JPG, HEIC" : "PNG, JPG, HEIC"}
          </p>

          {/* Hidden file input — gallery/photos (NO capture attribute) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {/* Hidden file input — camera only */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Image preview */}
          <div className="relative rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <img src={image} alt="Civil ID" className="w-full max-h-48 object-contain" style={{ background: "rgba(255,255,255,0.05)" }} />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 rounded-full p-1.5 backdrop-blur-sm"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Processing state */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isAr ? "جاري قراءة البطاقة..." : "Reading Civil ID..."}
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: "#fff" }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {result && !error && (
            <div className="rounded-lg p-3 space-y-2" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "#4ade80" }}>
                <CheckCircle2 className="h-4 w-4" />
                {isAr ? "تم قراءة البيانات بنجاح" : "Data extracted successfully"}
              </div>
              <div className="grid gap-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {result.civilIdNumber && <p>{isAr ? "رقم البطاقة" : "ID"}: {result.civilIdNumber}</p>}
                {result.civilIdName && <p>{isAr ? "الاسم" : "Name"}: {result.civilIdName}</p>}
                {result.civilIdDob && <p>{isAr ? "تاريخ الميلاد" : "DOB"}: {result.civilIdDob}</p>}
                {result.civilIdNationality && <p>{isAr ? "الجنسية" : "Nationality"}: {result.civilIdNationality}</p>}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#f87171" }} />
              <div>
                <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
                <button onClick={clearImage} className="mt-1 text-xs underline" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {isAr ? "حاول مرة أخرى" : "Try again"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
