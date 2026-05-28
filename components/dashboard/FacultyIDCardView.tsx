import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { CreditCard, RotateCcw, Loader, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface FacultyIDCardViewProps {
  faculty: any;
}

// ─── Template dimensions ─────────────────────────────────────────────────────
const CARD_W = 642;
const CARD_H = 896;

// ─── Front side coordinates (CSS: left, top) ─────────────────────────────────
const FRONT_COORDS = {
  photo: { left: 225, top: 143, width: 191, height: 190 },
  facultyName: { left: 190, top: 520, size: 24, maxWidth: 320 },
  employeeCode: { left: 300, top: 595, size: 18 },
  joinDate: { left: 235, top: 640, size: 18 },
  address: { left: 220, top: 685, size: 16, maxWidth: 320 },
};

// ─── Back side coordinates ───────────────────────────────────────────────────
const BACK_COORDS = {
  facultyId: { left: 230, top: 375, size: 18 },
  mobileNo: { left: 230, top: 412, size: 18 },
  franchise: { left: 230, top: 449, size: 18, maxWidth: 300 },
  franchiseFooter: { left: 105, top: 803, size: 13, maxWidth: 200 },
};

// ─── Helper: auto-fit font size ──────────────────────────────────────────────
function autoFitStyle(text: string, maxSize: number, maxWidth: number, fontWeight = 400): React.CSSProperties {
  const charWidth = 0.55;
  let size = maxSize;
  while (size > 10 && text.length * charWidth * size > maxWidth) size--;
  return { fontSize: `${size}px`, fontWeight };
}

const FacultyIDCardView: React.FC<FacultyIDCardViewProps> = ({ faculty }) => {
  const [facultyData, setFacultyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // Fetch full faculty data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const faculties = await api.getFaculty() as any[];
        const found = faculties.find((f: any) => f.id === faculty.id);
        if (found) {
          setFacultyData(found);
        } else {
          setError('Faculty profile not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load faculty data');
      } finally {
        setLoading(false);
      }
    };
    if (faculty?.id) fetchData();
  }, [faculty?.id]);

  // ─── Download PNG ──────────────────────────────────────────────────────────
  const downloadPNG = async (side: 'front' | 'back') => {
    const ref = side === 'front' ? frontRef.current : backRef.current;
    if (!ref) return;
    setDownloading(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(ref, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        width: CARD_W,
        height: CARD_H,
        scrollX: 0,
        scrollY: 0,
      });
      const link = document.createElement('a');
      link.download = `${side}-${facultyData?.employeeCode || 'faculty'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('PNG export error:', e); }
    setDownloading(false);
  };

  // ─── Download PDF ──────────────────────────────────────────────────────────
  const downloadPDF = async () => {
    if (!frontRef.current || !backRef.current) return;
    setDownloading(true);
    try {
      await document.fonts.ready;

      const options = {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        width: CARD_W,
        height: CARD_H,
        scrollX: 0,
        scrollY: 0,
      };

      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(frontRef.current, options),
        html2canvas(backRef.current, options),
      ]);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [CARD_W, CARD_H] });
      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, CARD_W, CARD_H);
      pdf.addPage([CARD_W, CARD_H], 'portrait');
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, CARD_W, CARD_H);
      pdf.save(`idcard-${facultyData?.employeeCode || 'faculty'}.pdf`);
    } catch (e) { console.error('PDF export error:', e); }
    setDownloading(false);
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="relative">
          <div className="w-[321px] h-[448px] rounded-2xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse shadow-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-10 h-10 text-gray-400 animate-spin" />
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-400 font-medium">Loading Faculty ID Card...</p>
      </div>
    );
  }

  // ─── No Data ───────────────────────────────────────────────────────────────
  if (!facultyData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="relative max-w-md w-full mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Faculty ID Card
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {error || 'Your faculty ID card is not available yet. Please contact your administrator.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
              <AlertCircle className="w-3 h-3" />
              <span>Faculty profile must be created before ID card is available</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Prepare display data ──────────────────────────────────────────────────
  const photoUrl = facultyData.avatarUrl || '';
  const joinDate = facultyData.joinDate
    ? new Date(facultyData.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'N/A';
  const displayScale = 0.5; // 642×896 → 321×448

  // ─── Style builders ────────────────────────────────────────────────────────
  const absStyle = (left: number, top: number, size: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    fontSize: `${size}px`,
    fontFamily: "'Poppins', sans-serif",
    color: '#1a1a2e',
    lineHeight: `${Math.round(size * 1.2)}px`,
    letterSpacing: '0px',
    margin: 0,
    padding: 0,
    whiteSpace: 'nowrap',
    zIndex: 2,
    ...extra,
  });

  // ─── Front Renderer ────────────────────────────────────────────────────────
  const renderFront = (ref?: React.RefObject<HTMLDivElement>) => (
    <div
      ref={ref as any}
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        position: 'relative',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <img
        src="/assets/facultyidfront.png"
        alt=""
        crossOrigin="anonymous"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        {/* Faculty Photo */}
        {photoUrl && (
          <div style={{
            position: 'absolute',
            left: `${FRONT_COORDS.photo.left}px`,
            top: `${FRONT_COORDS.photo.top}px`,
            width: `${FRONT_COORDS.photo.width}px`,
            height: `${FRONT_COORDS.photo.height}px`,
            borderRadius: '8px',
            overflow: 'hidden',
            zIndex: 1,
            backgroundColor: "#2eb2ffff"
          }}>
            <img src={photoUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        )}

        {/* Faculty Name */}
        <div style={absStyle(FRONT_COORDS.facultyName.left, FRONT_COORDS.facultyName.top, FRONT_COORDS.facultyName.size, {
          fontWeight: 700,
          color: '#ff0281',
          maxWidth: `${FRONT_COORDS.facultyName.maxWidth}px`,
          ...autoFitStyle(facultyData.name || '', FRONT_COORDS.facultyName.size, FRONT_COORDS.facultyName.maxWidth || 320, 700),
        })}>
          {facultyData.name || 'Faculty Name'}
        </div>

        {/* Employee Code */}
        <div style={absStyle(FRONT_COORDS.employeeCode.left, FRONT_COORDS.employeeCode.top, FRONT_COORDS.employeeCode.size || 18)}>
          {facultyData.employeeCode || facultyData.username || 'N/A'}
        </div>

        {/* Join Date */}
        <div style={absStyle(FRONT_COORDS.joinDate.left, FRONT_COORDS.joinDate.top, FRONT_COORDS.joinDate.size || 18)}>
          {joinDate}
        </div>

        {/* Address */}
        <div style={absStyle(FRONT_COORDS.address.left, FRONT_COORDS.address.top, FRONT_COORDS.address.size || 16, {
          maxWidth: `${FRONT_COORDS.address.maxWidth}px`,
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          lineHeight: '20px',
        })}>
          {facultyData.address || 'N/A'}
        </div>
      </div>
    </div>
  );

  // ─── Back Renderer ─────────────────────────────────────────────────────────
  const renderBack = (ref?: React.RefObject<HTMLDivElement>) => (
    <div
      ref={ref as any}
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        position: 'relative',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <img
        src="/assets/facultyidback.png"
        alt=""
        crossOrigin="anonymous"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        {/* Faculty ID / Username */}
        <div style={absStyle(BACK_COORDS.facultyId.left, BACK_COORDS.facultyId.top, BACK_COORDS.facultyId.size || 18)}>
          {facultyData.username || 'N/A'}
        </div>

        {/* Mobile No */}
        <div style={absStyle(BACK_COORDS.mobileNo.left, BACK_COORDS.mobileNo.top, BACK_COORDS.mobileNo.size || 18)}>
          {facultyData.phone || 'N/A'}
        </div>

        {/* Franchise (Main area - can be replaced with blood group etc later if needed) */}
        <div style={absStyle(BACK_COORDS.franchise.left, BACK_COORDS.franchise.top, BACK_COORDS.franchise.size || 18, {
          maxWidth: `${BACK_COORDS.franchise.maxWidth}px`,
        })}>
          {facultyData.franchiseName || 'N/A'}
        </div>

        {/* Franchise Name (footer) */}
        <div style={absStyle(BACK_COORDS.franchiseFooter.left, BACK_COORDS.franchiseFooter.top, BACK_COORDS.franchiseFooter.size || 12, {
          color: '#d4d4d4ff',
          maxWidth: `${BACK_COORDS.franchiseFooter.maxWidth}px`,
        })}>
          {facultyData.franchiseName || 'HQ'}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3 h-3" />
          Faculty ID Card
        </div>
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {facultyData.name}'s ID Card
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Employee Code: <span className="font-mono font-bold text-teal-600">{facultyData.employeeCode || facultyData.username}</span>
        </p>
      </div>

      {/* ─── 3D Flip Card ─────────────────────────────────────────────── */}
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-blue-500/20 rounded-3xl blur-xl" />

        <div
          className="relative cursor-pointer"
          style={{
            width: `${CARD_W * displayScale}px`,
            height: `${CARD_H * displayScale}px`,
            perspective: '1200px',
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.8s cubic-bezier(0.1, 0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}>
            {/* Front (scaled) */}
            <div style={{
              position: 'absolute',
              width: `${CARD_W}px`,
              height: `${CARD_H}px`,
              transform: `scale(${displayScale})`,
              transformOrigin: 'top left',
              backfaceVisibility: 'hidden',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}>
              {renderFront()}
            </div>

            {/* Back (scaled) */}
            <div style={{
              position: 'relative',
              width: `${CARD_W}px`,
              height: `${CARD_H}px`,
              transform: `rotateY(180deg) scale(${displayScale})`,
              transformOrigin: 'top left',
              backfaceVisibility: 'hidden',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}>
              {renderBack()}
            </div>
          </div>
        </div>

        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider shadow-lg z-10">
          {isFlipped ? '← Back Side' : 'Front Side →'}
        </div>
      </div>

      {/* ─── Hidden full-size cards for capture ───────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
        {renderFront(frontRef)}
        {renderBack(backRef)}
      </div>

      {/* ─── Action Buttons ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-md">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold text-sm hover:border-teal-300 hover:text-teal-600 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          Flip Card
        </button>
        <button
          onClick={() => downloadPNG('front')}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold text-sm hover:border-green-300 hover:text-green-600 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          Front PNG
        </button>
        <button
          onClick={() => downloadPNG('back')}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold text-sm hover:border-blue-300 hover:text-blue-600 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          Back PNG
        </button>
      </div>

      <button
        onClick={downloadPDF}
        disabled={downloading}
        className="mt-3 w-full max-w-md flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {downloading ? 'Generating...' : 'Download Complete PDF'}
      </button>

      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span>Faculty ID Card rendered from live data</span>
      </div>
    </div>
  );
};

export default FacultyIDCardView;
