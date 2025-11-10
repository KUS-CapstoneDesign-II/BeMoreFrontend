import { useEffect, useRef, useState } from 'react';

interface DeviceTestStepProps {
  onOpenHelp: () => void;
}

export function DeviceTestStep({ onOpenHelp }: DeviceTestStepProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState<boolean | null>(null);
  const [hasAudio, setHasAudio] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  const startTest = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => {});
      }
      setHasVideo(true);

      // Simple audio activity check
      const AC: typeof AudioContext | undefined = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioCtx = AC ? new AC() : null;
      if (!audioCtx) {
        setHasAudio(null);
        return;
      }
      const source = audioCtx.createMediaStreamSource(s);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let ticks = 0;
      const check = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const value = data[i];
          if (value !== undefined) {
            const v = (value - 128) / 128;
            sum += v * v;
          }
        }
        const rms = Math.sqrt(sum / data.length);
        if (rms > 0.02) setHasAudio(true);
        else if (++ticks > 60 && hasAudio === null) setHasAudio(false);
        if (stream) requestAnimationFrame(check);
      };
      check();
    } catch {
      setHasVideo(false);
      setHasAudio(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
        <div className="aspect-video bg-black rounded overflow-hidden">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        </div>
      </div>
      <div className="text-sm text-gray-700">
        <div className="flex items-center justify-between">
          <span>카메라 상태</span>
          <span className={hasVideo ? 'text-green-600' : hasVideo === null ? 'text-gray-500' : 'text-red-600'}>
            {hasVideo === null ? '대기 중' : hasVideo ? '정상' : '문제 있음'}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>마이크 입력</span>
          <span className={hasAudio ? 'text-green-600' : hasAudio === null ? 'text-gray-500' : 'text-red-600'}>
            {hasAudio === null ? '대기 중' : hasAudio ? '감지됨' : '감지 안 됨'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={startTest} className="px-3 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-700 text-white">테스트 시작</button>
        <button onClick={onOpenHelp} className="px-3 py-2 rounded-lg border text-sm bg-white text-gray-700 border-gray-300">권한 문제 해결</button>
      </div>
    </div>
  );
}
