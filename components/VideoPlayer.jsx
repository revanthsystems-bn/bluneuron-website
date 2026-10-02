'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Reveal from './Reveal';
import { MEDIA } from '@/lib/iriz';

export default function VideoPlayer() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onFsChange = () => setFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  /** The big center play button: starts playback with sound, full screen. */
  const playFullscreen = async () => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    try {
      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (video.requestFullscreen) {
        await video.requestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen(); // iOS Safari
      }
    } catch {
      // Fullscreen can be denied by the browser; playback still proceeds inline.
    }

    video.muted = false;
    setMuted(false);
    video.play();
    setPlaying(true);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const seek = (e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  };

  return (
    <section id="video" className="border-b border-border-subtle bg-black-soft py-20 scroll-mt-20">
      <div className="section-container">
        <Reveal className="mb-10 text-center">
          <p className="eyebrow mb-3">See It In Action</p>
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tighter text-white sm:text-4xl">
            The IRIZ, on a real wall.
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto max-w-4xl">
          <div
            ref={containerRef}
            className="group relative aspect-video w-full overflow-hidden rounded-[1.5rem] bg-black shadow-glass"
          >
            <video
              ref={videoRef}
              src={MEDIA.video.showcase}
              poster={MEDIA.product.angleIso}
              className="h-full w-full object-cover"
              muted={muted}
              playsInline
              preload="metadata"
              onTimeUpdate={onTimeUpdate}
              onClick={togglePlay}
              onEnded={() => setPlaying(false)}
            />

            {!playing && (
              <button
                onClick={playFullscreen}
                aria-label="Play video full screen"
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black">
                  <Play className="ml-1 h-6 w-6" fill="currentColor" />
                </span>
              </button>
            )}

            <div
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-10 transition-opacity duration-300 ${
                playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
              }`}
            >
              <div onClick={seek} className="mb-3 h-1 w-full cursor-pointer rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className="text-white hover:text-white/70">
                    {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="text-white hover:text-white/70">
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                </div>
                <button
                  onClick={toggleFullscreen}
                  aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  className="text-white hover:text-white/70"
                >
                  {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
