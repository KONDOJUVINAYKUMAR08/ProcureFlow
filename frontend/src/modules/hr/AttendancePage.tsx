import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../../services/endpoints';
import { formatDate } from '../../lib/utils';
import {
  Camera, MapPin, Clock, CheckCircle, LogOut, AlertCircle,
  RefreshCw, X, User, Calendar, TrendingUp,
} from 'lucide-react';

interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

const AttendancePage: React.FC = () => {
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [notes, setNotes] = useState('');
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);
  const [checkInDone, setCheckInDone] = useState(false);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: myRecords = [] } = useQuery({
    queryKey: ['my-attendance', currentMonth, currentYear],
    queryFn: () => hrApi.attendance.getMy({ month: currentMonth, year: currentYear }),
  });

  const { data: summary } = useQuery({
    queryKey: ['attendance-summary', currentMonth, currentYear],
    queryFn: () => hrApi.attendance.getSummary({ month: currentMonth, year: currentYear }),
    staleTime: 30000,
  });

  const todayRecord = (myRecords as any[]).find((r: any) => r.date === dateStr);

  // Request location
  const getLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.display_name) address = data.display_name.split(',').slice(0, 3).join(',');
        } catch (_) {}
        setLocation({ latitude, longitude, address });
      },
      (err) => setLocationError(`Location error: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start camera
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamRef(stream);
      setCameraActive(true);
    } catch (err: any) {
      setCameraError(`Camera error: ${err.message}. Please allow camera access.`);
    }
  };

  const stopCamera = () => {
    streamRef?.getTracks().forEach(t => t.stop());
    setStreamRef(null);
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  useEffect(() => () => { streamRef?.getTracks().forEach(t => t.stop()); }, [streamRef]);

  const checkInMutation = useMutation({
    mutationFn: () => hrApi.attendance.checkIn({
      photoBase64: capturedPhoto || undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      address: location?.address,
      notes,
    }),
    onSuccess: () => {
      setCheckInDone(true);
      setCapturedPhoto(null);
      setNotes('');
      qc.invalidateQueries({ queryKey: ['my-attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => hrApi.attendance.checkOut(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance-summary'] });
    },
  });

  const s = summary as any || {};
  const records = myRecords as any[];

  const statusColor = (status: string) => ({
    present: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    absent: 'bg-red-500/10 text-red-400 border-red-500/20',
    half_day: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    wfh: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    leave: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    holiday: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  }[status] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20');

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-description">Mark your daily attendance with selfie and location</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-card text-sm">
          <Clock size={16} className="text-indigo-400" />
          <span className="text-white font-semibold">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400">{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Month Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Present', value: s.present || 0, color: 'text-emerald-400' },
          { label: 'Absent', value: s.absent || 0, color: 'text-red-400' },
          { label: 'Half Day', value: s.halfDay || 0, color: 'text-amber-400' },
          { label: 'WFH', value: s.wfh || 0, color: 'text-cyan-400' },
          { label: 'Total Hours', value: `${s.totalHours || 0}h`, color: 'text-indigo-400' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-neutral-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-In Panel */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Camera size={18} className="text-indigo-400" /> Mark Attendance
          </h3>

          {checkInDone && !todayRecord?.checkInTime ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-lg font-semibold text-white">Check-in Successful!</p>
              <p className="text-sm text-neutral-400 mt-1">Your attendance has been recorded</p>
            </div>
          ) : todayRecord?.checkInTime && todayRecord?.checkOutTime ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-lg font-semibold text-white">Attendance Marked</p>
              <p className="text-sm text-neutral-400">In: {new Date(todayRecord.checkInTime).toLocaleTimeString('en-IN')}</p>
              <p className="text-sm text-neutral-400">Out: {new Date(todayRecord.checkOutTime).toLocaleTimeString('en-IN')}</p>
              <p className="text-sm text-emerald-400 font-semibold mt-2">{todayRecord.workingHours}h worked today</p>
            </div>
          ) : todayRecord?.checkInTime ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-sm text-emerald-400 font-semibold">✓ Checked in at {new Date(todayRecord.checkInTime).toLocaleTimeString('en-IN')}</p>
              </div>
              <button onClick={() => checkOutMutation.mutate()} disabled={checkOutMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-semibold transition-colors">
                <LogOut size={18} /> {checkOutMutation.isPending ? 'Checking out...' : 'Check Out'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Section */}
              {capturedPhoto ? (
                <div className="relative">
                  <img src={capturedPhoto} alt="Selfie" className="w-full rounded-xl border border-white/[0.06]" />
                  <button onClick={retakePhoto} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white">
                    <RefreshCw size={14} />
                  </button>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1 bg-black/60 rounded-lg px-2 py-1">
                    <CheckCircle size={12} className="text-emerald-400" />
                    <span className="text-xs text-white">Photo captured</span>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded-xl border border-indigo-500/30" playsInline muted autoPlay />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                    <button onClick={capturePhoto} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg transition-colors">
                      📸 Capture Selfie
                    </button>
                    <button onClick={stopCamera} className="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-white">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={startCamera} className="w-full py-8 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all flex flex-col items-center gap-2">
                  <Camera size={32} className="text-neutral-600" />
                  <p className="text-sm text-neutral-500">Click to open camera</p>
                  <p className="text-xs text-neutral-700">(Optional but recommended)</p>
                </button>
              )}

              {cameraError && <p className="text-xs text-amber-400 flex items-center gap-1"><AlertCircle size={12} />{cameraError}</p>}

              {/* Location */}
              <div>
                {location ? (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <MapPin size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-400">Location captured</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{location.address}</p>
                    </div>
                    <button onClick={() => setLocation(null)} className="ml-auto text-neutral-600 hover:text-neutral-400"><X size={12} /></button>
                  </div>
                ) : (
                  <button onClick={getLocation} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.03] text-sm text-neutral-400 hover:text-white transition-colors">
                    <MapPin size={16} /> Capture Location
                  </button>
                )}
                {locationError && <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} />{locationError}</p>}
              </div>

              {/* Notes */}
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes (WFH, late arrival, etc.)" className="input-field text-sm" />

              {/* Timestamp display */}
              <div className="flex items-center gap-2 text-xs text-neutral-500 bg-white/[0.02] rounded-lg p-2">
                <Clock size={12} />
                <span>Timestamp: {now.toLocaleString('en-IN')}</span>
              </div>

              {/* Check In Button */}
              <button
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold transition-colors"
              >
                <CheckCircle size={18} />
                {checkInMutation.isPending ? 'Checking in...' : 'Mark Check-In'}
              </button>

              {checkInMutation.error && (
                <p className="text-xs text-red-400 text-center">{(checkInMutation.error as any)?.response?.data?.message || 'Check-in failed'}</p>
              )}
            </div>
          )}
        </div>

        {/* This Month Calendar */}
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-cyan-400" />
            {now.toLocaleString('default', { month: 'long', year: 'numeric' })} Attendance
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {records.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8">No attendance records this month</p>
            ) : (
              records.map((r: any) => (
                <div key={r._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-xs font-bold text-neutral-400">
                      {new Date(r.date).getDate()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p className="text-xs text-neutral-500">
                        {r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {r.checkOutTime ? ` → ${new Date(r.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        {r.workingHours ? ` · ${r.workingHours}h` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${statusColor(r.status)}`}>
                    {r.status?.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
