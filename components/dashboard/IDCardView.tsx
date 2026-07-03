import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { CreditCard, RotateCcw, Loader, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Sparkles, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface IDCardViewProps {
  student: any;
}

// ─── Coordinate mappings (template: 662×1075, bottom-origin → CSS top-origin) ──
// Formula: top = 1075 - y - fontSize

const CARD_W = 662;
const CARD_H = 1075;

// Front side text positions (CSS: left, top, fontSize)
const FRONT_COORDS = {
  photo: { left: 190, top: 190, width: 285, height: 285 },
  name: { centerX: 331, top: 510, size: 46, maxWidth: 460 },
  course: { centerX: 331, top: 580, size: 26, maxWidth: 340 },
  roll: { left: 170, top: 655, size: 20 },
  blood: { left: 265, top: 690, size: 20 },
  phone: { left: 250, top: 725, size: 20 },
  address1: { left: 220, top: 760, size: 18, maxWidth: 340 },
  address2: { left: 150, top: 795, size: 18, maxWidth: 420 },
  joinDate: { left: 390, top: 848, size: 20 },
};

// Back side text positions
const BACK_COORDS = {
  parentName: { left: 290, top: 587, size: 18, maxWidth: 300 },
  emergencyPhone: { left: 135, top: 632, size: 18 },
  erpId: { left: 135, top: 673, size: 18 },
  franchiseAddr: { left: 100, top: 993, size: 16, maxWidth: 260 },
};

// ─── Helper: split address into 2 lines ──────────────────────────────────────
function splitAddress(address: string): { line1: string; line2: string } {
  if (!address || address.length <= 35) return { line1: address || '', line2: '' };
  let idx = address.lastIndexOf(',', 35);
  if (idx < 10) idx = address.lastIndexOf(' ', 35);
  if (idx < 10) idx = 35;
  return { line1: address.substring(0, idx + 1).trim(), line2: address.substring(idx + 1).trim() };
}

// ─── Helper: auto-fit font size ──────────────────────────────────────────────
function autoFitStyle(text: string, maxSize: number, maxWidth: number, fontWeight = 400): React.CSSProperties {
  // Approximate: each char is ~0.55× font size for Poppins
  const charWidth = 0.55;
  let size = maxSize;
  while (size > 10 && text.length * charWidth * size > maxWidth) size--;
  return { fontSize: `${size}px`, fontWeight };
}

const IDCardView: React.FC<IDCardViewProps> = ({ student }) => {
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // Fetch full student data with course, franchise etc.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const students = await api.getStudents() as any[];
        const found = students.find((s: any) => s.id === student.id);
        if (found) {
          setStudentData(found);
        } else {
          setError('Student profile not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    if (student?.id) fetchData();
  }, [student?.id]);

  // ─── Capture card face as PNG and trigger download ─────────────────────────
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
      link.download = `${side}-${studentData?.rollNumber || 'ID'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error('PNG export error:', e); }
    setDownloading(false);
  };

  // ─── Capture both sides and create 2-page PDF ─────────────────────────────
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

      // PDF page: 662×1075 points
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [CARD_W, CARD_H] });
      pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, CARD_W, CARD_H);
      pdf.addPage([CARD_W, CARD_H], 'portrait');
      pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, CARD_W, CARD_H);
      pdf.save(`idcard-${studentData?.rollNumber || 'ID'}.pdf`);
    } catch (e) { console.error('PDF export error:', e); }
    setDownloading(false);
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="relative">
          <div className="w-[330px] h-[536px] rounded-2xl bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse shadow-xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-10 h-10 text-gray-400 animate-spin" />
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-400 font-medium">Loading ID Card...</p>
      </div>
    );
  }

  // ─── No Data / No Roll Number ──────────────────────────────────────────────
  if (!studentData || !studentData.rollNumber) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
        <div className="relative max-w-md w-full mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-30 animate-pulse" />
          <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Student ID Card
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {error || 'Your ID card is not available yet. A verified Roll Number is required. Please contact your administrator.'}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-4">
              <AlertCircle className="w-3 h-3" />
              <span>Roll Number must be assigned before ID card is available</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Prepare display data ──────────────────────────────────────────────────
  const { line1: addr1, line2: addr2 } = splitAddress(studentData.address || '');
  const joinDateRaw = studentData.createdAt || studentData.admissionDate || studentData.joinDate;
  const joinDate = joinDateRaw
    ? new Date(joinDateRaw).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const photoUrl = studentData.avatarUrl || '';
  const displayScale = 0.5; // Scale down for UI display (662×1075 → 331×537)

  // ─── Absolute text overlay style builder ───────────────────────────────────
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

  const centeredStyle = (centerX: number, top: number, size: number, maxW: number, extra?: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute',
    left: `${centerX - maxW / 2}px`,
    top: `${top}px`,
    width: `${maxW}px`,
    fontSize: `${size}px`,
    fontFamily: "'Poppins', sans-serif",
    color: '#1a1a2e',
    lineHeight: `${Math.round(size * 1.2)}px`,
    letterSpacing: '0px',
    textAlign: 'center',
    margin: 0,
    padding: 0,
    whiteSpace: 'nowrap',
    zIndex: 2,
    ...extra,
  });

  // ─── Card Face Renderer (used for both display & capture) ──────────────────
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
        src="/assets/sttudentidfront.png"
        alt=""
        crossOrigin="anonymous"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        {/* Student Photo */}
        {photoUrl && (
          <div style={{
            position: 'absolute',
            left: `${FRONT_COORDS.photo.left}px`,
            top: `${FRONT_COORDS.photo.top}px`,
            width: `${FRONT_COORDS.photo.width}px`,
            height: `${FRONT_COORDS.photo.height}px`,
            borderRadius: '50%',
            overflow: 'hidden',
            zIndex: 1,
          }}>
            <img src={photoUrl} alt="" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        )}

        {/* Student Name (centered, bold, auto-fit) */}
        <div style={centeredStyle(FRONT_COORDS.name.centerX, FRONT_COORDS.name.top, FRONT_COORDS.name.size, FRONT_COORDS.name.maxWidth, {
          color: '#ff0281',
          fontWeight: 700,
          ...autoFitStyle(studentData.name || '', FRONT_COORDS.name.size, FRONT_COORDS.name.maxWidth, 700),
        })}>
          {studentData.name || 'Student Name'}
        </div>

        {/* Course Name (centered, auto-fit) */}
        <div style={centeredStyle(FRONT_COORDS.course.centerX, FRONT_COORDS.course.top, FRONT_COORDS.course.size, FRONT_COORDS.course.maxWidth, {
          color: '#0000b6',
          fontWeight: 600,
          ...autoFitStyle(studentData.courseName || '', FRONT_COORDS.course.size, FRONT_COORDS.course.maxWidth, 600),
        })}>
          {studentData.courseName || 'Course'}
        </div>

        {/* Roll Number */}
        <div style={absStyle(FRONT_COORDS.roll.left, FRONT_COORDS.roll.top, FRONT_COORDS.roll.size)}>
          {studentData.rollNumber || 'N/A'}
        </div>

        {/* Blood Group */}
        <div style={absStyle(FRONT_COORDS.blood.left, FRONT_COORDS.blood.top, FRONT_COORDS.blood.size)}>
          {studentData.bloodGroup || 'N/A'}
        </div>

        {/* Phone */}
        <div style={absStyle(FRONT_COORDS.phone.left, FRONT_COORDS.phone.top, FRONT_COORDS.phone.size)}>
          {studentData.phone || 'N/A'}
        </div>

        {/* Address Line 1 */}
        <div style={absStyle(FRONT_COORDS.address1.left, FRONT_COORDS.address1.top, FRONT_COORDS.address1.size, {
          maxWidth: `${FRONT_COORDS.address1.maxWidth}px`,
        })}>
          {addr1 || 'N/A'}
        </div>

        {/* Address Line 2 */}
        {addr2 && (
          <div style={absStyle(FRONT_COORDS.address2.left, FRONT_COORDS.address2.top, FRONT_COORDS.address2.size, {
            maxWidth: `${FRONT_COORDS.address2.maxWidth}px`,
          })}>
            {addr2}
          </div>
        )}

        {/* Join Date */}
        <div style={absStyle(FRONT_COORDS.joinDate.left, FRONT_COORDS.joinDate.top, FRONT_COORDS.joinDate.size)}>
          {joinDate}
        </div>
      </div>
    </div>
  );

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
        src="/assets/studentidback.png"
        alt=""
        crossOrigin="anonymous"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
        {/* Parent/Guardian Name */}
        <div style={absStyle(BACK_COORDS.parentName.left, BACK_COORDS.parentName.top, BACK_COORDS.parentName.size, {
          maxWidth: `${BACK_COORDS.parentName.maxWidth}px`,
        })}>
          {studentData.guardianName || 'N/A'}
        </div>

        {/* Emergency Phone */}
        <div style={absStyle(BACK_COORDS.emergencyPhone.left, BACK_COORDS.emergencyPhone.top, BACK_COORDS.emergencyPhone.size)}>
          {studentData.phone || 'N/A'}
        </div>

        {/* ERP ID */}
        <div style={absStyle(BACK_COORDS.erpId.left, BACK_COORDS.erpId.top, BACK_COORDS.erpId.size)}>
          {studentData.username || studentData.erpId || studentData.email?.split('@')[0] || 'N/A'}
        </div>

        {/* Franchise Address */}
        <div style={absStyle(BACK_COORDS.franchiseAddr.left, BACK_COORDS.franchiseAddr.top, BACK_COORDS.franchiseAddr.size, {
          maxWidth: `${BACK_COORDS.franchiseAddr.maxWidth}px`,
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          lineHeight: '18px',
        })}>
          {studentData.franchiseAddress || studentData.franchiseName || ''}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3 h-3" />
          Digital ID Card
        </div>
        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {studentData.name}'s ID Card
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Roll: <span className="font-mono font-bold text-indigo-600">{studentData.rollNumber}</span>
        </p>
      </div>

      {/* ─── 3D Flip Card (scaled down for display) ─────────────────────── */}
      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-xl" />

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
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
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
              position: 'absolute',
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

      {/* ─── Hidden full-size cards for html2canvas capture ─────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, zIndex: -9999, opacity: 0, pointerEvents: 'none' }}>
        {renderFront(frontRef)}
        {renderBack(backRef)}
      </div>

      {/* ─── Action Buttons ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full max-w-md">
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200 shadow-sm hover:shadow-md"
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
        className="mt-3 w-full max-w-md flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {downloading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        {downloading ? 'Generating...' : 'Download Complete PDF'}
      </button>

      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        <CheckCircle className="w-3 h-3 text-green-500" />
        <span>ID Card rendered from live student data</span>
      </div>
    </div>
  );
};

export default IDCardView;